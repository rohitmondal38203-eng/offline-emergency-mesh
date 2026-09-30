# Project Progress & Status Tracker

**Project:** APP-08 — Offline-First Disaster Emergency Mesh & Hazard Broadcast App  
**Last Updated:** Phase 1 Baseline Execution  
**Overall Status:** **PHASE 1 SKELETON INITIALIZED — APK BUILD PENDING JDK INSTALLATION**

---

## 1. High-Level Status Summary

| Area / Module | Status | Completion % | Notes |
| :--- | :---: | :---: | :--- |
| **Documentation & System Architecture** | **COMPLETED** | 100% | All 5 mandatory hackathon blueprints finalized. |
| **Application Core & Project Setup** | **COMPLETED** | 100% | React Native 0.73.6, TypeScript 5.0.4, Android project, Metro, npm dependencies installed, `tsc` clean. |
| **Basic UI Shell** | **COMPLETED** | 100% | Emergency high-contrast App.tsx with status areas and planned placeholders for FR-1 to FR-6. |
| **Android Gradle Baseline** | **CONFIGURED** | 80% | `build.gradle`, `app/build.gradle`, `AndroidManifest.xml` permissions ready; Gradle build pending host JDK. |
| **Physical Device Verification** | **PENDING** | 0% | Physical device verification pending (0 devices currently attached via ADB). |
| **P2P Mesh Discovery (BLE & Wi-Fi Direct)** | **NOT STARTED** | 0% | Planned for Phase 3. Service placeholders created in `src/services/ble`. |
| **Distress Beacon Generation (FR-3)** | **NOT STARTED** | 0% | Planned for Phase 4. Schemas defined in `src/models/types.ts`. |
| **Multi-Hop Relay Engine (FR-2)** | **NOT STARTED** | 0% | Planned for Phase 5. Store-and-forward placeholders in `src/services/mesh`. |
| **Offline Vector Map (FR-4)** | **NOT STARTED** | 0% | Planned for Phase 6. Placeholder in `src/services/maps`. |
| **Hazard Broadcast Feed (FR-5)** | **NOT STARTED** | 0% | Planned for Phase 7. Data models defined in `src/models/types.ts`. |
| **SOS Flashlight Strobe (FR-6)** | **NOT STARTED** | 0% | Planned for Phase 8. Permissions declared in `AndroidManifest.xml`. |
| **Security & Cryptography** | **NOT STARTED** | 0% | Planned for Phase 9. Placeholder in `src/services/security`. |
| **Multi-Device Integration Testing** | **NOT STARTED** | 0% | Multi-node testbed setup queued for Phase 10. |
| **Android Deployment & Release APK** | **NOT STARTED** | 0% | Queued for Phase 11. |

---

## 2. Requirement-by-Requirement Checklist

### Functional Requirements

* **[ ] FR-1: P2P Mesh Network Initialization**
  * [x] Service abstraction placeholder created (`src/services/ble/index.ts`).
  * [ ] BLE Peripheral advertisement broadcasting service UUID.
  * [ ] BLE Central background/foreground scanning.
  * [ ] Peer device discovery and proximity RSSI tracking.
  * [ ] Wi-Fi Direct P2P Group Owner negotiation (high-volume data).
  * [ ] Bidirectional socket/GATT communication channel.

* **[ ] FR-2: Multi-Hop Distress Packet Relay**
  * [x] Standard envelope interface defined (`src/models/types.ts`).
  * [x] Router service placeholder created (`src/services/mesh/index.ts`).
  * [ ] Application-layer packet envelope (UUID, Origin, TTL, Hops, Payload, Signature).
  * [ ] Store-and-forward persistence queue in local storage.
  * [ ] Seen-packet hash deduplication table (anti-looping).
  * [ ] Automatic TTL decrement and hop count increment.
  * [ ] Multi-hop relay validation across 3 physical devices ($A \to B \to C$).

* **[ ] FR-3: Distress Beacon Generation**
  * [x] Beacon schema defined (`src/models/types.ts`).
  * [x] Location service abstraction created (`src/services/location/index.ts`).
  * [x] UI placeholder button in App shell (explicitly disabled).
  * [ ] Emergency UI selector: *Medical Emergency*, *Food/Water*, *Trapped*.
  * [ ] Headcount input (Adults, Children, Injured).
  * [ ] Hardware GNSS offline coordinate acquisition (Latitude, Longitude, Accuracy).
  * [ ] Beacon payload compilation and local disk commit.
  * [ ] Emergency SOS trigger confirmation flow.

* **[ ] FR-4: Offline Vector Map**
  * [x] Map service placeholder created (`src/services/maps/index.ts`).
  * [x] UI placeholder card in App shell.
  * [ ] Embedded vector map tiles bundled within APK (zero online tile requests).
  * [ ] Offline map viewport rendering (pan, pinch, zoom).
  * [ ] Pre-cached GeoJSON layer for relief shelters and safe high-ground zones.
  * [ ] Dynamic map pin rendering for decoded peer distress beacons.
  * [ ] Tap-to-view survivor beacon details card.

* **[ ] FR-5: Local Hazard Broadcast**
  * [x] Broadcast payload interface defined (`src/models/types.ts`).
  * [x] UI placeholder card in App shell.
  * [ ] Authority broadcast creation interface (restricted/authenticated mode).
  * [ ] Broadcast message types (Evacuation route, Water point, Flood wave warning).
  * [ ] Priority mesh propagation flag.
  * [ ] Community-facing real-time broadcast alert list.

* **[ ] FR-6: Emergency Flashlight SOS Strobe**
  * [x] Camera and flashlight permissions declared in `AndroidManifest.xml`.
  * [x] UI placeholder card in App shell.
  * [ ] Camera2 torch hardware bridge integration.
  * [ ] Standardized Morse Code SOS timing loop ($\cdot\cdot\cdot ---\ \cdot\cdot\cdot$).
  * [ ] Background / locked-screen torch execution handling.
  * [ ] UI fallback screen strobe for devices lacking rear flash hardware.

### Non-Functional Requirements

* **[ ] NFR-1: Ultra-Low Battery Consumption**
  * [x] Scan and idle timing parameters specified in `src/config/index.ts`.
  * [ ] Dynamic duty cycle: 5s scan / 55s sleep in standby mode.
  * [ ] Battery level monitoring and automatic throttling below 20% capacity.
* **[ ] NFR-2: Cryptographic Verification**
  * [x] Cryptography service interface created (`src/services/security/index.ts`).
  * [ ] On-device Ed25519 asymmetric keypair generation.
  * [ ] Digital signature generation for all outgoing distress packets.
  * [ ] Signature verification and rejection of forged or altered packets.
* **[ ] NFR-3: Resilient Store-and-Forward Architecture**
  * [x] Storage service abstraction created (`src/storage/index.ts`).
  * [ ] Transactional local database storing transit packets across power cycles.
* **[ ] NFR-4: Strict Offline-First Operation**
  * [x] Verified zero remote network API dependencies in baseline project.
  * [ ] Complete feature operation in Airplane Mode without SIM or Wi-Fi internet.

---

## 3. Milestone Tracking

| Milestone | Target Phase | Status | Completion Date |
| :--- | :---: | :---: | :---: |
| **M0: Documentation & Design Baseline** | Phase 0 | **COMPLETED** | Completed |
| **M1: Compilable Project Skeleton on Hardware** | Phase 1 | **IN PROGRESS** (Code & config ready; APK build blocked on JDK) | Target: Next |
| **M2: Emergency UI & Navigation Functional** | Phase 2 | PENDING | Target: Next |
| **M3: 1-Hop BLE P2P Packet Exchange Confirmed** | Phase 3 | PENDING | Target: Later |
| **M4: Offline Distress Beacon Generated with GPS** | Phase 4 | PENDING | Target: Later |
| **M5: 3-Node Multi-Hop Relay Operational** | Phase 5 | PENDING | Target: Later |
| **M6: Offline Map Rendering Pre-Cached Tiles** | Phase 6 | PENDING | Target: Later |
| **M7: Hazard Broadcast & Torch SOS Integrated** | Phases 7–8 | PENDING | Target: Later |
| **M8: Cryptographic Signatures & Flood Guard** | Phase 9 | PENDING | Target: Later |
| **M9: Multi-Device Testbed Verification** | Phase 10 | PENDING | Target: Later |
| **M10: Release APK Generated & Verified** | Phase 11 | PENDING | Target: Later |
| **M11: Live Demo & Defense Rehearsal** | Phase 12 | PENDING | Target: Later |

---

## 4. Known Blockers & Technical Risks

1. **Host Environment JDK Absence:** Gradle requires a Java Development Kit (JDK 17) to execute Android builds (`JAVA_HOME is not set and no 'java' command could be found`). Android SDK build-tools and platform SDK are also not yet installed on the host system.
2. **Physical Device Availability:** 0 devices currently connected via ADB (`Physical device verification pending`).
3. **Android 12+ Bluetooth Permissions:** Android 12 introduced `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, and `BLUETOOTH_CONNECT` as runtime permissions requiring explicit user approval. Declared in `AndroidManifest.xml`.
4. **Aggressive Background Killing (OEM Battery Managers):** Vendors terminate background scanning services after minutes of screen lock. Foreground service permissions declared in `AndroidManifest.xml`.

---

## 5. Architectural & Technical Decisions Log

| Decision ID | Topic | Decision Made | Rationale & Alternatives Considered |
| :---: | :--- | :--- | :--- |
| **ADR-01** | Routing Topology | **Application-Layer Store-and-Forward (DTN)** | *Decision:* Implement routing at the app layer rather than expecting BLE/Wi-Fi to form an autonomous ad-hoc mesh. Standard mobile operating systems do not expose raw 802.11s or 6LoWPAN mesh kernels without root. |
| **ADR-02** | Primary Radio | **Bluetooth Low Energy (BLE)** | *Decision:* BLE chosen as primary discovery and routing radio due to low power consumption and rapid discovery. Wi-Fi Direct reserved as secondary high-bandwidth channel for batch sync. |
| **ADR-03** | Map Rendering | **Local Vector MBTiles / Static GeoJSON** | *Decision:* Store a localized bounding box vector cache locally. Discarded online tile servers or dynamic map fetching to guarantee 100% offline autonomy. |
| **ADR-04** | Cryptography | **Ed25519 Public-Key Signatures** | *Decision:* Ed25519 chosen for 64-byte compact signatures, fast verification on mobile ARM chips, and high resilience against forgery. |
| **ADR-05** | Mobile Framework Selection | **React Native (v0.73.6) + TypeScript (v5.0.4)** | *Decision:* Initialized React Native with strict TypeScript and native Android Gradle integration. Chosen over Flutter for rapid JS-based offline state management and direct access to native Android BLE/Wi-Fi Direct bridging. |

---

## 6. Testing Results Section

> *Notice: No physical Android test suites have been executed yet. Build verification is blocked on host JDK installation.*

| Test ID | Test Scenario | Target Metric | Measured Result | Status |
| :---: | :--- | :---: | :---: | :---: |
| **TC-00** | TypeScript Typecheck (`tsc --noEmit`) | 0 compilation errors | **0 errors (PASS)** | **VERIFIED** |
| **TC-01** | BLE 1-Hop Discovery Latency | $< 15\text{ seconds}$ | *Not tested yet* | Pending |
| **TC-02** | 3-Node Multi-Hop Packet Delivery ($A \to B \to C$) | $100\%\text{ delivery}$ | *Not tested yet* | Pending |
| **TC-03** | Offline GPS Cold Fix in Airplane Mode | Coordinates captured | *Not tested yet* | Pending |
| **TC-04** | Offline Map Load Time (Zero Network) | $< 2.0\text{ seconds}$ | *Not tested yet* | Pending |
| **TC-05** | Morse SOS Flashlight Frequency Stability | $\pm 20\text{ ms precision}$ | *Not tested yet* | Pending |
| **TC-06** | Tampered Packet Signature Rejection | Dropped instantly | *Not tested yet* | Pending |
| **TC-07** | 2-Hour Idle Battery Consumption | $< 6\%\text{ battery drain}$ | *Not tested yet* | Pending |

---

## 7. Change Log

* **Version 1.1.0 (Phase 1 Baseline):**
  * Finalized technology decision: React Native + TypeScript + Android.
  * Initialized React Native `package.json`, `tsconfig.json`, `metro.config.js`, `babel.config.js`, and `index.js`.
  * Installed 800 npm packages into `node_modules`; verified clean `tsc --noEmit` pass.
  * Formatted Android project structure: `build.gradle`, `app/build.gradle`, `gradle.properties`, `settings.gradle`, Gradle wrapper, and `AndroidManifest.xml` with justified emergency permissions.
  * Built high-contrast emergency UI shell (`App.tsx`) with status areas and placeholder cards for FR-1 through FR-6.
  * Created domain architecture directories in `src/` (`components/`, `screens/`, `navigation/`, `services/`, `models/`, `utils/`, `storage/`, `config/`).
  * Initialized local Git repository with `.gitignore` and committed Phase 1 baseline.
  * Audited host environment: Node.js and npm present; JDK and Android SDK absent; 0 ADB devices attached.
* **Version 1.0.0 (Phase 0 Baseline):**
  * Initialized documentation suite (`README.md`, `docs/PLANNING.md`, `docs/PROGRESS.md`, `docs/DEPLOYMENT.md`, `docs/DEFENSE_QA.md`).
