# Phase 3 Documentation: BLE Discovery & Basic P2P Presence

## 1. Selected BLE Library & Version
* **Library Name:** `react-native-ble-plx`
* **Version:** `3.1.2`
* **Compatibility Rationale:**
  * Fully compatible with React Native `0.73.6` (standard release branch for RN 0.72 - 0.73).
  * Automatically respects project SDK levels: `compileSdkVersion 34`, `targetSdkVersion 34`, `minSdkVersion 26`.
  * Integrates with Android Gradle Plugin `8.2.1` and Kotlin `1.9.22` with zero Gradle version conflicts or namespace errors.
  * Powers BLE Central scanning, device RSSI tracking, and connection lifecycle.
* **Native Peripheral Advertiser:**
  * Implemented via custom Android native module `ResqBleAdvertiserModule.kt` utilizing Android's framework-level `android.bluetooth.le.BluetoothLeAdvertiser`.
  * Requires zero third-party transitive dependencies and maintains 100% build stability.

---

## 2. Android Permissions Configuration

### Declared Manifest Permissions (`android/app/src/main/AndroidManifest.xml`)
* **Android 12+ (API 31+):**
  * `android.permission.BLUETOOTH_SCAN`: Allows discovering nearby BLE beacons and peripherals.
  * `android.permission.BLUETOOTH_CONNECT`: Allows querying device names and establishing basic P2P GATT links.
  * `android.permission.BLUETOOTH_ADVERTISE`: Allows broadcasting the local phone's presence beacon.
* **Legacy Android (API <= 30):**
  * `android.permission.BLUETOOTH` & `android.permission.BLUETOOTH_ADMIN` (maxSdkVersion=30)
  * `android.permission.ACCESS_FINE_LOCATION`: Required by the Android OS on older versions to execute BLE hardware scans.

### Runtime Permission State Handling (`src/services/ble/blePermissions.ts`)
The application distinguishes between 5 distinct hardware/permission states:
1. **Bluetooth Disabled:** Detected via `BluetoothAdapter.isEnabled` / `BleManager.state()`; notifies the user to turn on Bluetooth.
2. **Permissions Denied:** Prompts the user with an in-app button ("🔑 GRANT BLUETOOTH RUNTIME PERMISSIONS").
3. **Permissions Permanently Blocked:** Detects `NEVER_ASK_AGAIN` and directs user to OS App Settings.
4. **BLE Unsupported:** Hardware does not possess BLE controller chip.
5. **BLE Available and Ready:** Permissions granted and Bluetooth powered on; scanning and advertising active.

---

## 3. RESQ-MESH Peer Identity Format

### Format Specification
```
RESQ-MESH:<4-HEX-DIGITS>
Example: RESQ-MESH:7F3A
```

### Identity Attributes
* **Non-PII:** Contains strictly random hexadecimal characters; no phone number, MAC address, IMEI, or user name is leaked.
* **Stable Persistence:** Provisioned once on first launch and stored in Android `SharedPreferences` (`resq_mesh_identity` / `peer_id`). Persists across app closures and device reboots.
* **Routing Compatibility:** Designed as the node identity for Phase 4 distress packet headers and Phase 5 multi-hop routing envelopes.

---

## 4. Architecture & Separation of Concerns

```
src/services/ble/
├── types.ts              # Data contracts: BlePeer, BleRadioState, BlePermissionStatus, Service UUID
├── peerIdentity.ts       # Stable non-PII identity generator & SharedPreferences reader
├── blePermissions.ts     # Platform & version-aware permission checker / requester
├── bleAdvertiser.ts      # Native bridge to Android BluetoothLeAdvertiser
├── bleService.ts         # Central scanner, deduplication map, RSSI sorter, connection manager
└── index.ts              # Barrel export

android/app/src/main/java/com/disastermesh/app/
├── ResqBleAdvertiserModule.kt # Framework BluetoothLeAdvertiser implementation
└── ResqBlePackage.kt          # React Native module registration
```

---

## 5. BLE Advertising Implementation & Limitations

### Advertising Strategy
* Uses standard 128-bit Service UUID: `0000fd08-0000-1000-8000-00805f9b34fb`.
* **Primary Advertising Packet (31-byte limit):** Broadcasts Service UUID with `setIncludeDeviceName(false)` to prevent `ADVERTISE_FAILED_DATA_TOO_LARGE` errors.
* **Scan Response Packet:** Broadcasts the local device name (`RESQ-MESH:XXXX`).
* **Power & Frequency:** `ADVERTISE_MODE_LOW_LATENCY` and `ADVERTISE_TX_POWER_HIGH` for maximum disaster range.

### Hardware & OS Limitations
* **Multiple Advertisement Support:** Some low-end or legacy chipsets do not support `BluetoothAdapter.isMultipleAdvertisementSupported`. The app queries this capability before starting and reports hardware limitation gracefully.
* **OS Background Restrictions:** Android aggressive battery optimization (e.g., Doze mode, MIUI battery saver) throttles BLE advertising when the screen is off unless a persistent foreground service is running (planned for Phase 5).
* **Payload Constraints:** BLE 4.x legacy advertising restricts advertising payload to 31 bytes; distress packet payloads cannot fit inside advertisements and require Phase 4/5 GATT data transfers.

---

## 6. What Phase 3 Implements vs What Phase 4 Will Implement

### Phase 3 Implements (COMPLETED)
1. Real hardware BLE scanning (no fake/mock peers, no hard-coded IDs).
2. De-duplication of discovered devices with live RSSI updating.
3. Native BLE peripheral presence advertising with local node identity.
4. Basic 1-to-1 P2P link connection and clean disconnection.
5. In-app Bluetooth and runtime permission management.
6. 20-second automatic scan timeout with resource cleanup on unmount.

### What Phase 4 Will Implement (NEXT PHASE)
1. Offline hardware GNSS fix acquisition (Latitude, Longitude, Accuracy).
2. Distress Beacon payload serialization (Trapped, Medical, Fire, Supplies, Headcount).
3. Local disk commit & message queue in persistent storage.
4. P2P packet transmission protocol over BLE GATT characteristics.
5. *(Note: Multi-hop relay and store-and-forward mesh routing belong to Phase 5).*
