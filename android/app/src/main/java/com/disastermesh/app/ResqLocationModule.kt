package com.disastermesh.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap

/**
 * ResqLocationModule
 * Pure offline Android GNSS/GPS location provider.
 * Does NOT require Google Play Services, online geocoding, or internet connectivity.
 */
class ResqLocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ResqLocationModule"

    private val locationManager: LocationManager? by lazy {
        reactApplicationContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    }

    @ReactMethod
    fun isGpsAvailable(promise: Promise) {
        val lm = locationManager
        if (lm == null) {
            promise.resolve(false)
            return
        }
        val isGpsEnabled = lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        promise.resolve(isGpsEnabled || isNetworkEnabled)
    }

    @ReactMethod
    fun getCurrentLocation(timeoutMs: Double, promise: Promise) {
        val lm = locationManager
        if (lm == null) {
            promise.reject("LOCATION_UNAVAILABLE", "Location manager not available on this device")
            return
        }

        // 1. Verify runtime location permissions
        val hasFine = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val hasCoarse = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasFine && !hasCoarse) {
            promise.reject("PERMISSION_NOT_GRANTED", "Location permission not granted by user")
            return
        }

        // 2. Verify hardware provider status
        val isGpsEnabled = lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

        if (!isGpsEnabled && !isNetworkEnabled) {
            promise.reject("GPS_DISABLED", "Location services/GPS disabled on device")
            return
        }

        val provider = when {
            isGpsEnabled -> LocationManager.GPS_PROVIDER
            isNetworkEnabled -> LocationManager.NETWORK_PROVIDER
            else -> LocationManager.PASSIVE_PROVIDER
        }

        val mainHandler = Handler(Looper.getMainLooper())
        var isResolved = false

        // Location listener for fresh hardware fix
        val locationListener = object : LocationListener {
            override fun onLocationChanged(loc: Location) {
                if (isResolved) return
                isResolved = true
                try {
                    lm.removeUpdates(this)
                } catch (_: Exception) {}
                promise.resolve(locationToMap(loc))
            }

            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }

        // Timeout fallback
        val timeoutDuration = if (timeoutMs > 0) timeoutMs.toLong() else 15000L
        val timeoutRunnable = Runnable {
            if (isResolved) return@Runnable
            isResolved = true
            try {
                lm.removeUpdates(locationListener)
            } catch (_: Exception) {}

            // Check cached location as fallback
            try {
                val lastGps = if (isGpsEnabled) lm.getLastKnownLocation(LocationManager.GPS_PROVIDER) else null
                val lastNet = if (isNetworkEnabled) lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER) else null
                val best = when {
                    lastGps != null && lastNet != null -> if (lastGps.time > lastNet.time) lastGps else lastNet
                    lastGps != null -> lastGps
                    else -> lastNet
                }

                if (best != null) {
                    promise.resolve(locationToMap(best))
                } else {
                    promise.reject("TIMEOUT_OR_UNAVAILABLE", "GPS fix timed out and no cached location was found")
                }
            } catch (e: SecurityException) {
                promise.reject("PERMISSION_NOT_GRANTED", "Security exception accessing last known location: ${e.message}")
            }
        }

        mainHandler.post {
            try {
                mainHandler.postDelayed(timeoutRunnable, timeoutDuration)
                lm.requestLocationUpdates(
                    provider,
                    0L,
                    0f,
                    locationListener,
                    Looper.getMainLooper()
                )
            } catch (e: SecurityException) {
                if (!isResolved) {
                    isResolved = true
                    mainHandler.removeCallbacks(timeoutRunnable)
                    promise.reject("PERMISSION_NOT_GRANTED", "Security exception requesting location updates: ${e.message}")
                }
            } catch (e: Exception) {
                if (!isResolved) {
                    isResolved = true
                    mainHandler.removeCallbacks(timeoutRunnable)
                    promise.reject("LOCATION_UNAVAILABLE", "Failed to request location updates: ${e.message}")
                }
            }
        }
    }

    private fun locationToMap(location: Location): WritableMap {
        val map = Arguments.createMap()
        map.putDouble("latitude", location.latitude)
        map.putDouble("longitude", location.longitude)
        map.putDouble("accuracy", location.accuracy.toDouble())
        map.putDouble("timestamp", location.time.toDouble())
        return map
    }
}
