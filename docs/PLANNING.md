# Development & Execution Plan

**Project:** APP-08 — Offline-First Disaster Emergency Mesh & Hazard Broadcast App  
**Document Version:** 1.0.0  
**Status:** Approved Roadmap / Phase 0 Completed

---

## 1. Phased Development Roadmap

### Phase 0 — Documentation & Architecture Design
* **Objective:** Establish clear, factual, and rigorous project documentation, system architecture models, security threat models, and verification roadmaps prior to code execution.
* **Features / Tasks:**
  * Draft comprehensive `README.md` with problem framing, FR-1 to FR-6 mapping, and architecture overview.
  * Formulate `docs/PLANNING.md` including a 32-hour hackathon execution schedule, risk register, and MVP scoping.
  * Create `docs/PROGRESS.md` baseline tracker for milestones, decisions, blockers, and test audits.
  * Formulate `docs/DEPLOYMENT.md` defining multi-device testbed prerequisites, Android OS permission strategies, and APK build plans.
  * Write `docs/DEFENSE_QA.md` with in-depth technical defense Q&A, viva explanations, and judge elevator pitches.
* **Expected Output:** 5 complete, cross-referenced Markdown files in root and `docs/`.
* **Dependencies:** Hackathon problem statement requirements.
* **Testing / Checkpoint:** Verify consistency, technical realism, absence of premature implementation claims, and complete structural alignment.

---

### Phase 1 — Project Setup & Environment Baseline
* **Objective:** Initialize the cross-platform mobile framework, baseline configurations, dependency manifests, and build scripts.
* **Features / Tasks:**
  * Initialize the mobile framework repository (React Native with TypeScript OR Flutter).
  * Configure Android build systems (`build.gradle`, `settings.gradle`, CMake/NDK if native C++ bridging is required).
  * Setup code linting, formatting, and strict TypeScript/Dart type-checking.
  * Declare required Android runtime and install permissions in `AndroidManifest.xml`.
  * Establish modular project folder structure: `/src/radio`, `/src/mesh`, `/src/storage`, `/src/geo`, `/src/ui`, `/src/crypto`.
* **Expected Output:** Clean, compilable skeleton application running a blank "Hello Disaster Mesh" screen on an Android physical device.
* **Dependencies:** Phase 0 approval, Android SDK tools, Java 17+, Node.js / Flutter SDK.
* **Testing / Checkpoint:** `npx react-native run-android` or `flutter run` produces zero build errors and installs cleanly on physical target hardware.

---

### Phase 2 — Basic Mobile UI & Navigation Shell
* **Objective:** Construct an accessible, high-contrast, emergency-optimized mobile user interface designed for high-stress situations.
* **Features / Tasks:**
  * Implement dark-mode first, high-contrast theme (OLED power-saving, readable under direct sunlight or pitch-black darkness).
  * Build persistent bottom/tab navigation:
    1. **Emergency SOS Tab:** Primary trigger interface for requesting rescue.
    2. **Mesh Monitor Tab:** Visible peer count, active multi-hop links, and transit packet telemetry.
    3. **Offline Map Tab:** Vector map viewport with shelter and hazard overlays.
    4. **Hazard Broadcast Tab:** Stream of verified disaster updates and community bulletins.
    5. **Flashlight / Tools Tab:** Quick-access strobe and acoustic tools.
  * Build emergency confirmation modals and large touch targets (minimum 48x48 dp for gloved or trembling fingers).
* **Expected Output:** Interactive UI prototype running on physical devices with mock navigation transitions and localized state.
* **Dependencies:** Phase 1 project scaffolding.
* **Testing / Checkpoint:** Manual UI inspection across multiple screen densities; verify tactile response and zero frame-drop transitions.

---

### Phase 3 — P2P Connectivity Engine (BLE & Wi-Fi Direct)
* **Objective:** Implement hardware-level discovery, advertising, and bidirectional peer-to-peer data transport without internet infrastructure.
* **Features / Tasks:**
  * Implement **BLE Peripheral Manager:** Advertise custom 128-bit Disaster Service UUID and compact 20-31 byte broadcast beacon.
  * Implement **BLE Central Manager:** Continuous and duty-cycled scanning for peer disaster beacons.
  * Establish GATT server/client characteristics for connection-oriented payload transfers ($> 512$ bytes).
  * Implement **Wi-Fi Direct (P2P) Group Manager:** Group Owner (GO) negotiation and local Wi-Fi direct socket connection for high-bandwidth batch packet syncing.
  * Create a Unified Radio Abstraction Interface (`RadioTransport`) decoupling mesh logic from specific physical radios.
* **Expected Output:** Two physical devices running APP-08 discover each other within 5–15 seconds and exchange a raw test ping packet over BLE/Wi-Fi Direct.
* **Dependencies:** Phase 1 native module setup, physical Android devices with Bluetooth 5.0+ and Wi-Fi Direct.
* **Testing / Checkpoint:** Turn OFF Wi-Fi (internet), Mobile Data, and SIM cards on both devices; successfully discover and transmit a 64-byte payload.

---

### Phase 4 — Distress Beacon Generation & Local State
* **Objective:** Enable users to author, encode, sign, and store standardized emergency distress messages with offline sensor fixes.
* **Features / Tasks:**
  * Build the **Distress Beacon Generator** UI:
    * Select emergency status: *Medical Emergency*, *Food/Water Shortage*, *Trapped / Structure Collapse*.
    * Input headcount count (Adults, Children, Elderly/Injured).
    * Optional short message string (max 64 characters for packet economy).
  * Integrate offline Android GNSS (`LocationManager` / `FusedLocationProviderClient`) to capture latitude, longitude, and accuracy radius without A-GPS / cellular assistance.
  * Structure standardized binary/JSON distress packet schema (UUID, Timestamp, Lat, Lon, Status, Headcount, Sequence, Signature).
  * Commit newly created beacons to local transactional database.
* **Expected Output:** User can trigger a beacon, view their coordinates and formatted beacon summary on-screen, stored locally in persistent SQLite storage.
* **Dependencies:** Phase 2 UI, Phase 1 storage dependencies.
* **Testing / Checkpoint:** Place phone in Airplane Mode (GNSS on); generate beacon; verify database record contains valid coordinates and timestamp.

---

### Phase 5 — Multi-Hop Routing & Store-and-Forward Engine
* **Objective:** Build the decentralized opportunistic forwarding engine allowing packets to hop across multiple intermediate devices ($A \to B \to C$).
* **Features / Tasks:**
  * Implement **Epidemic Store-and-Forward Protocol:**
    * When Device B encounters Device A, they exchange compact message-ID digests (Bloom filter or seen-hashes).
    * Missing packets are transmitted and saved to Device B's local database.
  * Enforce strict **Packet Deduplication Cache:** Reject already-processed message UUIDs to avoid infinite cycles.
  * Implement **Time-To-Live (TTL) & Hop Counter:** Decrement TTL on each hop (initial TTL = 5); drop packets exceeding maximum hop threshold.
  * Implement priority packet queue: Distress Beacons (Priority 1) pre-empt Hazard Updates (Priority 2).
* **Expected Output:** Packet originated on Device A successfully reaches Device C via Device B without direct RF contact between A and C.
* **Dependencies:** Phase 3 radio engine, Phase 4 beacon schema.
* **Testing / Checkpoint:** 3-Device Bench Test: Space Device A and Device C out of radio range; carry Device B between them; verify Device C receives and logs Device A's beacon.

---

### Phase 6 — Offline Vector Map & GeoJSON Overlays
* **Objective:** Provide a fast, offline vector map rendering emergency shelters, hazard zones, and decoded survivor beacons.
* **Features / Tasks:**
  * Bundle local-area vector map tiles (MBTiles format or pre-rendered offline vector geo-cache) inside the application asset bundle.
  * Configure offline map renderer (MapLibre / custom Canvas tile renderer) with zero network tile fetch calls.
  * Render dynamic overlay layers:
    * Layer 1: High-ground safe zones & designated relief shelters (pre-loaded GeoJSON).
    * Layer 2: Incoming distress beacons dynamically plotted at their decoded GPS coordinates.
  * Provide map controls: center on user GPS fix, toggle shelter markers, tap distress beacon for headcount details.
* **Expected Output:** Fluid, responsive offline map displaying user location and incoming distress pins with zero active network connections.
* **Dependencies:** Phase 2 UI, Phase 4 distress coordinates.
* **Testing / Checkpoint:** Clear OS network cache, disable internet, pan/zoom across target emergency zone; verify all tiles render crisp vector geometry.

---

### Phase 7 — Local Hazard Broadcast Engine
* **Objective:** Enable rescue coordinators and verified authorities to disseminate critical safety bulletins across the mesh.
* **Features / Tasks:**
  * Build Hazard Broadcast Composer interface (exclusive to authenticated or designated responder roles).
  * Structure broadcast schema: Hazard Type (Flood Wave, Water Point, Structural Collapse, Evacuation Route), Expiration Timestamp, Geo-Bounding Box.
  * Transmit hazard bulletins through the Store-and-Forward engine with global mesh dissemination flags.
  * Build victim-side broadcast notification feed with urgency color badges and map cross-linking.
* **Expected Output:** Responder publishes "Clean drinking water available at Central School"; message propagates across all connected mesh nodes.
* **Dependencies:** Phase 5 multi-hop engine, Phase 2 UI.
* **Testing / Checkpoint:** Broadcast alert from Node 1; verify reception on Node 2 and Node 3 with immediate UI badge update.

---

### Phase 8 — Emergency Flashlight SOS Strobe
* **Objective:** Implement a low-level hardware camera torch driver to transmit optical SOS signals for night-time search and rescue.
* **Features / Tasks:**
  * Interface with Android `CameraManager.setTorchMode()`.
  * Program standardized international Morse Code SOS timing ($3\text{ short}, 3\text{ long}, 3\text{ short}$):
    * Dot ($\cdot$): 200 ms ON.
    * Dash ($-$): 600 ms ON.
    * Intra-character space: 200 ms OFF.
    * Letter space: 600 ms OFF.
    * Word / Loop cycle space: 1400 ms OFF.
  * Implement screen white-strobe fallback for devices without physical rear camera flash or low battery status.
* **Expected Output:** Continuous, rhythmically accurate optical SOS pulse accessible via a single emergency tap.
* **Dependencies:** Android hardware camera permissions.
* **Testing / Checkpoint:** Measure flash timing using stopwatch/oscilloscope test; verify continuous looping with screen locked or app backgrounded.

---

### Phase 9 — Security, Cryptographic Signatures & Reliability
* **Objective:** Prevent malicious actors from flooding the disaster mesh with spoofed beacons or forged emergency updates.
* **Features / Tasks:**
  * Generate an Ed25519 keypair during initial app onboarding using Android Keystore / software crypto library.
  * Digital signature generation: `Signature = Sign(PrivateKey, SHA256(PacketData))`.
  * Packet verification: Receiver validates `Verify(PublicKey, Signature, Payload)` before caching or retransmitting.
  * Authority Whitelisting: Pre-embed responder root public keys so only verified officials can issue Hazard Broadcasts.
  * Rate-limiting & Flooding Protection: Limit any single node ID to a maximum of 2 new beacons per 60 seconds to thwart DoS battery drain.
* **Expected Output:** Corrupted or forged packets fail verification and are instantly discarded without mesh propagation.
* **Dependencies:** Phase 4 beacon encoding, Phase 7 broadcasts.
* **Testing / Checkpoint:** Unit test feeding an intentionally altered payload with a valid signature; verify receiver flags `INVALID_SIGNATURE` and drops packet.

---

### Phase 10 — Multi-Device Integration & Field Simulation Testing
* **Objective:** Validate end-to-end functionality across realistic physical multi-device network topologies in simulated disaster conditions.
* **Features / Tasks:**
  * Execute 3-node and 4-node physical device mesh trials.
  * Measure end-to-end packet delivery latency across multiple hops.
  * Measure battery drain rate over a continuous 2-hour scan/advertise cycle.
  * Test network partition and heal behaviors: disconnect Node B, verify packets remain cached in Node A, reconnect Node B, verify delayed synchronization.
* **Expected Output:** Documented empirical test results proving multi-hop delivery, low battery impact, and store-and-forward resilience.
* **Dependencies:** Phases 1–9.
* **Testing / Checkpoint:** Verification of test cases against pre-defined acceptance criteria.

---

### Phase 11 — Android APK Generation & Field Deployment
* **Objective:** Produce clean, signed standalone Android application packages (APKs) that can be sideloaded onto any target device without Google Play Services.
* **Features / Tasks:**
  * Configure Proguard / R8 code shrinking and native library ABI filters (`armeabi-v7a`, `arm64-v8a`).
  * Generate release signing keystore and configure `build.gradle` signing configs.
  * Build standalone release APK: `./gradlew assembleRelease`.
  * Verify clean offline installation via `adb install` or local file manager sideloading.
* **Expected Output:** `app-release.apk` artifact ready for direct peer-to-peer distribution.
* **Dependencies:** Clean build passing all linter and compilation checks.
* **Testing / Checkpoint:** Fresh install on a clean Android device with zero development tools; launch and verify all offline assets.

---

### Phase 12 — Hackathon Presentation, Live Demo & Defense Prep
* **Objective:** Prepare a high-impact, bulletproof live demonstration and technical defense for the judging panel.
* **Features / Tasks:**
  * Configure 3 physical devices:
    * Device 1: *Victim Phone* (Airplane mode, GPS enabled).
    * Device 2: *Relay Phone* (Airplane mode, carried by presenter).
    * Device 3: *Rescue Command Dashboard* (Airplane mode, viewing map).
  * Rehearse timed 30-second, 1-minute, and 3-minute technical pitches.
  * Prepare live demonstration script: Trigger beacon on Device 1 $\to$ Relay through Device 2 $\to$ Instant map pin emergence on Device 3.
  * Review all questions in `docs/DEFENSE_QA.md` across team members.
* **Expected Output:** Seamless live demo delivery showcasing multi-hop rescue packet propagation with zero internet connectivity.
* **Dependencies:** Phase 11 functional APK installed on 3 physical devices.
* **Testing / Checkpoint:** Dry run completed 3 consecutive times without a single packet failure.

---

## 2. 32-Hour Hackathon Execution Timeline

| Time Window | Phase | Key Milestones & Deliverables | Target Checkpoint |
| :--- | :--- | :--- | :--- |
| **Hour 00:00 – 02:00** | **Phase 0** | Documentation & Architecture finalized (`README`, `PLANNING`, `PROGRESS`, `DEPLOYMENT`, `DEFENSE_QA`). | All 5 docs reviewed and committed. |
| **Hour 02:00 – 04:30** | **Phase 1** | Mobile framework initialized, Android permissions configured, build scripts operational. | Blank app builds and runs on physical phone. |
| **Hour 04:30 – 07:30** | **Phase 2** | Core emergency UI, theme, navigation bar, high-contrast SOS screens. | Interactive UI prototype on device. |
| **Hour 07:30 – 11:30** | **Phase 3** | BLE Peripheral/Central advertising & scanning engine, Wi-Fi Direct baseline. | Device-to-device 1-hop ping confirmed. |
| **Hour 11:30 – 14:00** | **Phase 4** | Distress beacon generator, offline GNSS GPS capture, local SQLite schema. | Offline beacon generated and stored. |
| **Hour 14:00 – 18:30** | **Phase 5** | Multi-hop store-and-forward engine, packet deduplication, TTL decrement. | 3-device hop verified ($A \to B \to C$). |
| **Hour 18:30 – 21:30** | **Phase 6** | Bundled offline vector map tiles, shelter pins, distress pin dynamic rendering. | Map pans/zooms and plots beacon offline. |
| **Hour 21:30 – 23:30** | **Phase 7** | Local hazard broadcast composer and recipient feed integration. | Broadcast propagates across test nodes. |
| **Hour 23:30 – 01:00** | **Phase 8** | Hardware Camera2 torch Morse code SOS strobe driver. | Timed optical SOS flash validated. |
| **Hour 01:00 – 03:30** | **Phase 9** | Ed25519 digital signatures, packet validation, rate-limiting anti-flood. | Tampered packets successfully rejected. |
| **Hour 03:30 – 05:30** | **Phase 10** | End-to-end multi-device integration testing, edge-case failure simulation. | 3-node mesh run without internet. |
| **Hour 05:30 – 07:00** | **Phase 11** | Release APK generation, sideloading verification, multi-device install. | Final signed APK generated and verified. |
| **Hour 07:00 – 08:00** | **Phase 12** | Demo rehearsal, presentation deck alignment, final defense Q&A drill. | Ready for judges. |

---

## 3. Feature Prioritization Matrix

```
       HIGH IMPACT
            ▲
            │  [P0] Distress Beacon        [P0] P2P Multi-Hop Relay
            │  [P0] Offline GPS Latch      [P1] Offline Vector Map
            │  [P1] Hazard Broadcast       [P1] Cryptographic Signatures
            │
            │  [P2] Morse Flashlight SOS   [P2] Wi-Fi Direct High-Speed Sync
            │  [P3] Audio Ultrasonic Ping  [P3] LoRa External Bridge
            │
            └────────────────────────────────────────────────────────►
           LOW COMPLEXITY                               HIGH COMPLEXITY
```

### P0: Absolute MVP (Must-Have for Demo Qualification)
1. **P2P BLE Discovery & 1-Hop Relay:** Discover peer devices over BLE advertisements without internet.
2. **Distress Beacon Generator:** User enters status (Medical, Food, Trapped), headcount, captures raw GPS fix.
3. **Application-Layer Multi-Hop Forwarding:** Store-and-forward routing engine across at least 3 physical nodes ($A \to B \to C$).
4. **Basic Local Persistence:** Cached received distress records in local database.

### P1: Core Hackathon Enhancements (Target for High Scoring)
1. **Offline Vector Map Rendering:** Pre-bundled vector tiles showing user position, relief shelters, and decoded victim pins.
2. **Local Hazard Broadcast Feed:** Emergency alert propagation with verified authority tags.
3. **Ed25519 Cryptographic Verification:** Digital signing of distress packets to prevent malicious beacon injection.
4. **Battery Saver Duty Cycling:** Alternating scan intervals to minimize power draw.

### P2: Polish & Extended Functionality
1. **Emergency Flashlight Morse SOS:** Camera flash hardware strobe for night search and rescue.
2. **Wi-Fi Direct Batch Sync:** Automatic high-bandwidth link negotiation when payload volume exceeds BLE capacity.
3. **RSSI-Based Distance Estimator:** Approximate distance indicator based on Bluetooth signal strength.

### P3: Stretch Goals (Post-Hackathon Roadmap)
1. **External LoRa Bridge Module:** Serial/Bluetooth link to ESP32 LoRa transmitter for 5–10 km point-to-point links.
2. **Ultrasonic Audio Data Chirping:** Data transmission over sound waves using microphone/speaker.
3. **Voice Note Compression:** 2-second ultra-compressed offline voice clip transmission (Opus at 6 kbps).

---

## 4. Risk Register & Mitigation Strategies

| ID | Risk Description | Likelihood | Impact | Mitigation Strategy |
| :---: | :--- | :---: | :---: | :--- |
| **R-1** | **Android OS Background Radio Throttling:** Android 10+ heavily restricts background BLE scanning and Wi-Fi P2P to conserve battery. | High | Critical | Implement an explicit Android Foreground Service with a persistent, non-dismissible notification (`FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE`). |
| **R-2** | **BLE Packet Size Limitation:** Legacy BLE advertising packets are limited to 31 bytes total payload. | High | High | Use Bluetooth 5.0 Extended Advertising (up to 254 bytes) where supported; fallback to GATT connection or fragmentation for multi-packet assembly. |
| **R-3** | **Wi-Fi Direct Group Owner (GO) Negotiation Delays:** Autonomous GO negotiation can take 8–15 seconds and frequently fails across heterogeneous OEM chipsets. | High | Medium | Prioritize BLE as the primary low-latency mesh routing backbone; utilize Wi-Fi Direct strictly for opportunistic large payload exchanges. |
| **R-4** | **Broadcast Storms in Dense Crowds:** In an evacuation center with hundreds of devices, naive flooding will exhaust device memory and radio bandwidth. | Medium | High | Implement strict hop limits (TTL $\le 5$), hash-based deduplication caches, and randomized retransmission jitter (100–500 ms). |
| **R-5** | **Offline Map Asset Size:** Bundling nationwide satellite or vector maps will inflate APK size into gigabytes. | High | High | Restrict pre-bundled vector MBTiles strictly to the target disaster municipality/district (< 30 MB compressed GeoJSON/vector tiles). |
| **R-6** | **Cold GPS Fix Latency:** Without cellular A-GPS (Assisted GPS), acquiring an initial satellite lock indoors or under canopy can take 2–5 minutes. | Medium | Medium | Allow beacon transmission with "Last Known Location" or manual grid estimation flag while satellite lock proceeds in background. |

---

## 5. Technical Unknowns Requiring Validation

1. **Dual BLE Role Concurrency:** Can target physical Android devices reliably advertise as a BLE Peripheral while concurrently scanning as a BLE Central across different OEM chipsets (Samsung, Xiaomi, OnePlus)?
2. **Wi-Fi Direct & Local Wi-Fi Coexistence:** Does initiating a Wi-Fi P2P Group Owner disconnect the phone from an active LAN or cause radio lockups on older Android versions?
3. **Background Torch Execution:** Does the Android `CameraManager` allow torch activation while the screen is locked, or does it trigger an OS security exception?
4. **GPS Time-to-First-Fix (TTFF) in Airplane Mode:** Exact empirical timing for acquiring cold raw GNSS satellite fixes without internet assistance.
