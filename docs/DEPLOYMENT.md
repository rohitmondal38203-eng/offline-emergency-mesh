# Deployment & Multi-Device Testing Guide

**Project:** APP-08 — Offline-First Disaster Emergency Mesh & Hazard Broadcast App  
**Status:** Planned Deployment Blueprint *(Commands and configurations will be executed in Phase 1 & Phase 11)*

---

## 1. Important Notice: Planned vs. Verified Steps

| Classification | Meaning in this Document |
| :--- | :--- |
| **PLANNED** | Defined architectural procedures, configuration templates, and operational steps to be executed during the development lifecycle. |
| **VERIFIED** | Steps that have been physically compiled, run, tested, and validated on hardware. *(Currently zero steps are verified as Phase 0 focuses solely on documentation).* |

---

## 2. Development Environment Requirements

To compile and build the mobile project, the host development machine requires the following toolchains:

### Host Operating System
* Windows 10/11 (PowerShell 7+ / CMD) OR macOS (Ventura / Sonoma) OR Ubuntu Linux (22.04 LTS).

### Core Tooling (Planned)
* **Java Development Kit (JDK):** OpenJDK 17 (LTS) or Amazon Corretto 17.
* **Android SDK:**
  * Android SDK Build-Tools 34.0.0
  * Android SDK Platform 34 (Android 14) and backwards compatibility down to SDK 26 (Android 8.0 Oreo).
  * Android NDK (Side by side 25.1.8937393 or later if native C++ bindings are utilized).
* **Package Managers & Runtimes (Subject to Phase 1 framework finalization):**
  * Node.js LTS (v18.x or v20.x) + npm/yarn (if React Native is finalized).
  * Flutter SDK (3.19.x or later) (if Flutter is finalized).
* **Physical Hardware Interface:**
  * USB 3.0 ports and high-speed data cables for Android Debug Bridge (`adb`) multi-device flashing.
  * Wireless ADB support on physical local testing network.

---

## 3. Target Android Hardware Requirements

A minimum of **2 physical Android devices** (recommended: 3 devices) is mandatory to validate peer-to-peer mesh propagation:

* **Operating System:** Android 8.0 (API Level 26) or higher.
* **Bluetooth Hardware:** Bluetooth 4.2 Minimum; Bluetooth 5.0+ strongly recommended (supports Extended Advertising and Higher Data Rates).
* **Wi-Fi Hardware:** Wi-Fi 802.11 b/g/n/ac with Wi-Fi Direct (P2P) driver support.
* **Sensors:** Dedicated GNSS/GPS hardware chip (autonomous satellite fix capability).
* **Camera / Optical:** Rear-facing camera with accessible LED flash unit.

---

## 4. Planned Project Setup & Build Procedures

> *Note: Framework-specific commands are parameterized below. Exact package scripts will be initialized in Phase 1.*

### 4.1 Dependency Installation (Planned)
Once the framework is initialized:
```bash
# Clone the project repository
git clone <repository-url>
cd APP-08-Disaster-Mesh

# If React Native:
# npm install --frozen-lockfile
# cd android && ./gradlew clean && cd ..

# If Flutter:
# flutter pub get
```

### 4.2 Debug Build & Local Device Run (Planned)
```bash
# Verify attached physical devices
adb devices -l

# Build and flash debug APK to connected device:
# For React Native:
# npx react-native run-android --mode=debug --deviceId=<device_serial>

# For Flutter:
# flutter run -d <device_serial> --debug
```

### 4.3 Production Release Build & APK Generation (Planned)
To create an offline-distributable standalone APK:
```bash
# Navigate to Android native build directory
cd android

# Generate release bundle via Gradle wrapper
# (Ensure signing configs are set in android/app/build.gradle)
./gradlew assembleRelease

# Generated output path:
# android/app/build/outputs/apk/release/app-release.apk
```

### 4.4 Sideloading APK to Physical Devices (Planned)
```bash
# Sideload release APK via ADB to specific device:
adb -s <device_serial_1> install -r app-release.apk
adb -s <device_serial_2> install -r app-release.apk
adb -s <device_serial_3> install -r app-release.apk
```

---

## 5. Android Permissions Strategy

Disaster response software requires access to hardware radios and sensors without reliance on cloud backends. The following permissions are required in `AndroidManifest.xml`:

### 5.1 Bluetooth & BLE Permissions
```xml
<!-- Legacy BLE (Android 11 and lower) -->
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />

<!-- Modern BLE (Android 12+, API 31+) -->
<!-- Required to discover nearby peer devices -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" 
                 android:usesPermissionFlags="neverForLocation" />
<!-- Required to advertise this device to nearby peers -->
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<!-- Required to connect and exchange GATT packets -->
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />
```

### 5.2 Wi-Fi Direct (P2P) Permissions
```xml
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.INTERNET" /> <!-- Needed for local P2P sockets -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-feature android:name="android.hardware.wifi.direct" android:required="true" />
```

### 5.3 Location & GNSS Permissions
```xml
<!-- Coarse and Fine location are required by Android OS for BLE scanning and offline GPS coordinates -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" android:required="true" />
```

### 5.4 Camera / Flashlight Permissions
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera.flash" android:required="false" />
```

### 5.5 Foreground Service & Battery Optimization
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

---

## 6. Offline Testing Procedures

Testing must strictly replicate zero-connectivity disaster zones.

### 6.1 Device Isolation Protocol (MANDATORY)
Before running mesh tests on all test devices:
1. **Enable Airplane Mode:** Completely shuts off cellular voice, mobile data, and default Wi-Fi.
2. **Manually Re-Enable Bluetooth:** Turns on the BLE radio while cellular remains strictly disabled.
3. **Remove / Disable SIM Cards:** Ensure zero fallback to 2G/3G/4G/5G towers.
4. **Disconnect Wi-Fi Router:** Ensure devices are not connected to any common local LAN or WAN gateway.
5. **Verify Zero Connectivity:** Open a browser and verify `ERR_INTERNET_DISCONNECTED`.

### 6.2 Offline GPS Acquisition Test
1. Take Device 1 outdoors or near a window with an unobstructed sky view.
2. Launch APP-08 with Airplane Mode active.
3. Trigger "Get GPS Fix".
4. Monitor time required for cold satellite lock (expect 30–120 seconds without A-GPS).
5. Verify coordinates match known physical latitude/longitude within 10–25 meters accuracy.

---

## 7. Multi-Device Mesh Verification Procedure

To test **FR-2 (Multi-Hop Relay)** across 3 devices ($A \to B \to C$):

```
[ Device A: Victim ]  <--- BLE Range (30m) --->  [ Device B: Intermediate Relay ]  <--- BLE Range (30m) --->  [ Device C: Rescue Team ]
 (Originates Beacon)                               (No direct sight to C initially)                               (Terminal Receiver)
```

1. **Step 1: Physical Placement:**
   * Place Device A and Device C far apart (e.g., opposite ends of a building or separated by concrete walls) such that Device A and Device C **cannot** see each other over BLE.
   * Verify via BLE scan monitor that Device C does not detect Device A's UUID.
2. **Step 2: Beacon Creation:**
   * On Device A: Select *Trapped*, Headcount: *3*, and tap **"Send Distress Beacon"**.
   * Verify beacon is saved to Device A's local database.
3. **Step 3: Intermediate Forwarding:**
   * Position Device B midway between Device A and Device C.
   * Device B discovers Device A via BLE advertising.
   * Device B ingests the packet, decrements TTL ($5 \to 4$), increments hop count ($0 \to 1$), stores it in its local queue, and rebroadcasts it.
4. **Step 4: Terminal Delivery:**
   * Device C detects Device B's re-advertised packet.
   * Device C validates the cryptographic signature, extracts the payload, and displays a prominent **"RESCUE REQUEST RECEIVED"** banner.
   * Device C automatically plots Device A's GPS coordinates on its offline vector map.
5. **Step 5: Loop Prevention Verification:**
   * Device B rebroadcasts to Device A.
   * Device A inspects the incoming packet UUID, matches it against its own local cache, and silently drops the packet without infinite looping.

---

## 8. Troubleshooting & Diagnostics

| Symptom | Probable Cause | Diagnostic & Resolution Steps |
| :--- | :--- | :--- |
| **Devices cannot discover each other via BLE** | Location permission denied or Bluetooth disabled. | Android requires *Fine Location* permission to expose BLE scan results. Verify in App Settings $\to$ Permissions $\to$ Location $\to$ "Allow all the time". Ensure Bluetooth is toggled ON. |
| **BLE connection drops immediately after handshake** | Android MTU or GATT connection limit exceeded. | Keep packet payloads compact ($\le 256$ bytes). If using GATT, explicitly call `gatt.close()` after completing write operations to free hardware radio channels. |
| **App terminates when screen turns off** | OEM aggressive battery management (Doze mode). | Prompt user to exempt APP-08 from Battery Optimization. Ensure the app runs as a `ForegroundService` with a persistent status bar notification. |
| **GPS coordinates return (0.0, 0.0) or null** | Device tested indoors without cellular assistance. | Testing indoors shields satellite signals. Move near a window or outdoors. Allow up to 2 minutes for raw GNSS cold almanac lock. |
| **Wi-Fi Direct Group Owner negotiation timeout** | Conflicting Wi-Fi state or concurrent tethering. | Ensure hotspot/tethering is turned OFF. Reset Wi-Fi state via `WifiManager.setWifiEnabled(false)` then `true`. |
| **Camera torch fails to light up** | Camera device locked by another process. | Ensure no other app or background service holds an open camera instance. Release `CameraDevice` handle immediately after strobe pulse sequence. |

---

## 9. Final Hackathon Demo Deployment Checklist

* [ ] Minimum 3 physical Android test devices charged to 100% battery.
* [ ] All 3 devices verified in **Airplane Mode** with Wi-Fi disabled and Bluetooth enabled.
* [ ] Release APK sideloaded and verified on all 3 devices.
* [ ] Pre-cached offline vector map files verified inside device local storage.
* [ ] All runtime permissions (Bluetooth, Location, Camera) pre-granted on all devices.
* [ ] Display screen sleep timeout set to "Never" or 30 minutes on all demo devices.
* [ ] Backup video recording of multi-hop propagation ready on presenter laptop in case of extreme 2.4 GHz RF congestion in the hackathon arena.
