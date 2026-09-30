package com.disastermesh.app

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelUuid
import android.util.Base64
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.UUID
import kotlin.random.Random

class ResqBleAdvertiserModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val PREFS_NAME = "resq_mesh_identity"
    private val KEY_PEER_ID = "peer_id"
    private val MESH_STORE_FILE = "resq_mesh_store.json"

    private var advertiser: BluetoothLeAdvertiser? = null
    private var advertiseCallback: AdvertiseCallback? = null
    private var isCurrentlyAdvertising = false

    private var gattServer: BluetoothGattServer? = null
    private var isGattServerActive = false

    override fun getName(): String = "ResqBleAdvertiser"

    private fun getBluetoothAdapter(): BluetoothAdapter? {
        val manager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        return manager?.adapter ?: BluetoothAdapter.getDefaultAdapter()
    }

    private fun getPrefs(): SharedPreferences {
        return reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @ReactMethod
    fun getPeerIdentity(promise: Promise) {
        try {
            val prefs = getPrefs()
            var peerId = prefs.getString(KEY_PEER_ID, null)
            if (peerId.isNullOrEmpty()) {
                val hexTag = String.format("%04X", Random.nextInt(0x1000, 0xFFFF))
                peerId = "RESQ-MESH:$hexTag"
                prefs.edit().putString(KEY_PEER_ID, peerId).apply()
            }
            promise.resolve(peerId)
        } catch (e: Exception) {
            promise.reject("IDENTITY_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun isAdvertisingSupported(promise: Promise) {
        try {
            val adapter = getBluetoothAdapter()
            if (adapter == null) {
                promise.resolve(false)
                return
            }
            val supported = adapter.isMultipleAdvertisementSupported
            promise.resolve(supported)
        } catch (e: Exception) {
            promise.reject("CHECK_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        try {
            val adapter = getBluetoothAdapter()
            promise.resolve(adapter != null && adapter.isEnabled)
        } catch (e: Exception) {
            promise.reject("CHECK_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun isAdvertising(promise: Promise) {
        promise.resolve(isCurrentlyAdvertising)
    }

    @ReactMethod
    fun startAdvertising(peerId: String, serviceUuidStr: String, promise: Promise) {
        try {
            val adapter = getBluetoothAdapter()
            if (adapter == null) {
                promise.reject("UNSUPPORTED", "Bluetooth is not available on this device")
                return
            }
            if (!adapter.isEnabled) {
                promise.reject("DISABLED", "Bluetooth is turned off")
                return
            }

            // Check runtime permissions on Android 12+ (API 31+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val advGranted = ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.BLUETOOTH_ADVERTISE
                ) == PackageManager.PERMISSION_GRANTED

                if (!advGranted) {
                    promise.reject("PERMISSION_DENIED", "BLUETOOTH_ADVERTISE permission not granted")
                    return
                }
            }

            if (!adapter.isMultipleAdvertisementSupported) {
                promise.reject("UNSUPPORTED", "Device hardware does not support BLE Peripheral advertising")
                return
            }

            advertiser = adapter.bluetoothLeAdvertiser
            if (advertiser == null) {
                promise.reject("NO_ADVERTISER", "BluetoothLeAdvertiser not available")
                return
            }

            // Stop any existing advertisement before starting new one
            if (isCurrentlyAdvertising && advertiseCallback != null) {
                try {
                    advertiser?.stopAdvertising(advertiseCallback)
                } catch (_: Exception) {}
                isCurrentlyAdvertising = false
            }

            // Attempt to update adapter's local name to the peer ID if connect permitted
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
                ContextCompat.checkSelfPermission(reactContext, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
            ) {
                try {
                    adapter.name = peerId
                } catch (_: Exception) {}
            }

            val pUuid = ParcelUuid.fromString(serviceUuidStr)

            // Primary packet: service UUID (compact to prevent ADVERTISE_FAILED_DATA_TOO_LARGE)
            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .setTimeout(0)
                .build()

            val advertiseData = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addServiceUuid(pUuid)
                .build()

            // Scan response packet: includes the human-readable peer name
            val scanResponse = AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .build()

            advertiseCallback = object : AdvertiseCallback() {
                override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                    super.onStartSuccess(settingsInEffect)
                    isCurrentlyAdvertising = true
                    val result: WritableMap = Arguments.createMap().apply {
                        putBoolean("success", true)
                        putString("peerId", peerId)
                        putString("serviceUuid", serviceUuidStr)
                    }
                    promise.resolve(result)
                }

                override fun onStartFailure(errorCode: Int) {
                    super.onStartFailure(errorCode)
                    isCurrentlyAdvertising = false
                    val errorMsg = when (errorCode) {
                        ADVERTISE_FAILED_DATA_TOO_LARGE -> "Advertise packet exceeds 31-byte limit"
                        ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Too many active BLE advertisers"
                        ADVERTISE_FAILED_ALREADY_STARTED -> "Advertising already in progress"
                        ADVERTISE_FAILED_INTERNAL_ERROR -> "Internal BLE controller error"
                        ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "BLE advertising unsupported by hardware"
                        else -> "Advertising failed with error code $errorCode"
                    }
                    promise.reject("ADVERTISE_FAILED", errorMsg)
                }
            }

            advertiser?.startAdvertising(settings, advertiseData, scanResponse, advertiseCallback)

        } catch (e: Exception) {
            isCurrentlyAdvertising = false
            promise.reject("ADVERTISE_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        try {
            if (advertiser != null && advertiseCallback != null && isCurrentlyAdvertising) {
                advertiser?.stopAdvertising(advertiseCallback)
                isCurrentlyAdvertising = false
                advertiseCallback = null
                promise.resolve(true)
            } else {
                isCurrentlyAdvertising = false
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.localizedMessage, e)
        }
    }

    // ==========================================
    // PHASE 4: GATT SERVER & MESH DATA RECEPTION
    // ==========================================

    @ReactMethod
    fun startGattServer(serviceUuidStr: String, charUuidStr: String, promise: Promise) {
        try {
            if (isGattServerActive && gattServer != null) {
                promise.resolve(true)
                return
            }

            val manager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            if (manager == null) {
                promise.reject("NO_BLUETOOTH", "BluetoothManager not available")
                return
            }

            val callback = object : BluetoothGattServerCallback() {
                override fun onCharacteristicWriteRequest(
                    device: BluetoothDevice,
                    requestId: Int,
                    characteristic: BluetoothGattCharacteristic,
                    preparedWrite: Boolean,
                    responseNeeded: Boolean,
                    offset: Int,
                    value: ByteArray?
                ) {
                    super.onCharacteristicWriteRequest(
                        device,
                        requestId,
                        characteristic,
                        preparedWrite,
                        responseNeeded,
                        offset,
                        value
                    )

                    // Acknowledge GATT write if requested by client
                    if (responseNeeded) {
                        try {
                            gattServer?.sendResponse(
                                device,
                                requestId,
                                BluetoothGatt.GATT_SUCCESS,
                                offset,
                                value
                            )
                        } catch (_: Exception) {}
                    }

                    // Forward incoming data payload to React Native layer
                    if (value != null && value.isNotEmpty()) {
                        val base64Data = Base64.encodeToString(value, Base64.NO_WRAP)
                        val params = Arguments.createMap().apply {
                            putString("senderAddress", device.address)
                            putString("data", base64Data)
                            putString("characteristicUuid", characteristic.uuid.toString())
                        }
                        reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            ?.emit("onMeshGattPacketReceived", params)
                    }
                }

                override fun onConnectionStateChange(
                    device: BluetoothDevice,
                    status: Int,
                    newState: Int
                ) {
                    super.onConnectionStateChange(device, status, newState)
                    val params = Arguments.createMap().apply {
                        putString("deviceAddress", device.address)
                        putBoolean("connected", newState == BluetoothProfile.STATE_CONNECTED)
                    }
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        ?.emit("onMeshGattConnectionChange", params)
                }
            }

            gattServer = manager.openGattServer(reactContext, callback)
            if (gattServer == null) {
                promise.reject("GATT_ERROR", "Failed to open BluetoothGattServer")
                return
            }

            val serviceUuid = UUID.fromString(serviceUuidStr)
            val charUuid = UUID.fromString(charUuidStr)

            val service = BluetoothGattService(
                serviceUuid,
                BluetoothGattService.SERVICE_TYPE_PRIMARY
            )

            val characteristic = BluetoothGattCharacteristic(
                charUuid,
                BluetoothGattCharacteristic.PROPERTY_WRITE or
                    BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
                    BluetoothGattCharacteristic.PROPERTY_READ,
                BluetoothGattCharacteristic.PERMISSION_WRITE or
                    BluetoothGattCharacteristic.PERMISSION_READ
            )

            service.addCharacteristic(characteristic)
            gattServer?.addService(service)

            isGattServerActive = true
            promise.resolve(true)
        } catch (e: Exception) {
            isGattServerActive = false
            promise.reject("GATT_SERVER_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun stopGattServer(promise: Promise) {
        try {
            if (gattServer != null) {
                gattServer?.close()
                gattServer = null
            }
            isGattServerActive = false
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_GATT_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun isGattServerRunning(promise: Promise) {
        promise.resolve(isGattServerActive)
    }

    // ==========================================
    // PHASE 4: LOCAL PERSISTENT STORAGE BRIDGE
    // ==========================================

    @ReactMethod
    fun saveMeshStore(jsonString: String, promise: Promise) {
        try {
            val file = File(reactContext.filesDir, MESH_STORE_FILE)
            file.writeText(jsonString, Charsets.UTF_8)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun loadMeshStore(promise: Promise) {
        try {
            val file = File(reactContext.filesDir, MESH_STORE_FILE)
            if (file.exists()) {
                val content = file.readText(Charsets.UTF_8)
                promise.resolve(content)
            } else {
                promise.resolve("{}")
            }
        } catch (e: Exception) {
            promise.reject("LOAD_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun clearMeshStore(promise: Promise) {
        try {
            val file = File(reactContext.filesDir, MESH_STORE_FILE)
            if (file.exists()) {
                file.delete()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e.localizedMessage, e)
        }
    }

    // React Native NativeEventEmitter requirement
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
