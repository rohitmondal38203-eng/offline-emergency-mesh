# Project Progress & Status Tracker

**Project:** APP-08 — Offline-First Disaster Emergency Mesh & Hazard Broadcast App  
**Last Updated:** Current (Phase 0 Baseline)  
**Overall Status:** **PHASE 0 COMPLETED — APPLICATION IMPLEMENTATION PENDING**

---

## 1. High-Level Status Summary

| Area / Module | Status | Completion % | Notes |
| :--- | :---: | :---: | :--- |
| **Documentation & System Architecture** | **COMPLETED** | 100% | All 5 mandatory hackathon blueprints finalized. |
| **Application Core & Project Setup** | **NOT STARTED** | 0% | Framework initialization queued for Phase 1. |
| **P2P Mesh Discovery (BLE & Wi-Fi Direct)** | **NOT STARTED** | 0% | Radio abstractions and native bindings pending. |
| **Distress Beacon Generation (FR-3)** | **NOT STARTED** | 0% | Payload schemas designed; implementation pending. |
| **Multi-Hop Relay Engine (FR-2)** | **NOT STARTED** | 0% | Store-and-forward routing logic designed. |
| **Offline Vector Map (FR-4)** | **NOT STARTED** | 0% | GeoJSON shelter data identified; tile bundle pending. |
| **Hazard Broadcast Feed (FR-5)** | **NOT STARTED** | 0% | Bulletin protocol specified; UI/relay pending. |
| **SOS Flashlight Strobe (FR-6)** | **NOT STARTED** | 0% | Morse timing designed; Camera2 bridge pending. |
| **Security & Cryptography** | **NOT STARTED** | 0% | Ed25519 signing architecture specified. |
| **Multi-Device Integration Testing** | **NOT STARTED** | 0% | Multi-node testbed setup queued for Phase 10. |
| **Android Deployment & APK Generation** | **NOT STARTED** | 0% | Build pipeline and signing config queued for Phase 11. |

---

## 2. Requirement-by-Requirement Checklist

### Functional Requirements

* **[ ] FR-1: P2P Mesh Network Initialization**
  * [ ] BLE Peripheral advertisement broadcasting service UUID.
  * [ ] BLE Central background/foreground scanning.
  * [ ] Peer device discovery and proximity RSSI tracking.
  * [ ] Wi-Fi Direct P2P Group Owner negotiation (high-volume data).
  * [ ] Bidirectional socket/GATT communication channel.

* **[ ] FR-2: Multi-Hop Distress Packet Relay**
  * [ ] Application-layer packet envelope (UUID, Origin, TTL, Hops, Payload, Signature).
  * [ ] Store-and-forward persistence queue in local storage.
  * [ ] Seen-packet hash deduplication table (anti-looping).
  * [ ] Automatic TTL decrement and hop count increment.
  * [ ] Multi-hop relay validation across 3 physical devices ($A \to B \to C$).

* **[ ] FR-3: Distress Beacon Generation**
  * [ ] Emergency UI selector: *Medical Emergency*, *Food/Water*, *Trapped*.
  * [ ] Headcount input (Adults, Children, Injured).
  * [ ] Hardware GNSS offline coordinate acquisition (Latitude, Longitude, Accuracy).
  * [ ] Beacon payload compilation and local disk commit.
  * [ ] Emergency SOS trigger confirmation flow.

* **[ ] FR-4: Offline Vector Map**
  * [ ] Embedded vector map tiles bundled within APK (zero online tile requests).
  * [ ] Offline map viewport rendering (pan, pinch, zoom).
  * [ ] Pre-cached GeoJSON layer for relief shelters and safe high-ground zones.
  * [ ] Dynamic map pin rendering for decoded peer distress beacons.
  * [ ] Tap-to-view survivor beacon details card.

* **[ ] FR-5: Local Hazard Broadcast**
  * [ ] Authority broadcast creation interface (restricted/authenticated mode).
  * [ ] Broadcast message types (Evacuation route, Water point, Flood wave warning).
  * [ ] Priority mesh propagation flag.
  * [ ] Community-facing real-time broadcast alert list.

* **[ ] FR-6: Emergency Flashlight SOS Strobe**
  * [ ] Camera2 torch hardware bridge integration.
  * [ ] Standardized Morse Code SOS timing loop ($\cdot\cdot\cdot ---\ \cdot\cdot\cdot$).
  * [ ] Background / locked-screen torch execution handling.
  * [ ] UI fallback screen strobe for devices lacking rear flash hardware.

### Non-Functional Requirements

* **[ ] NFR-1: Ultra-Low Battery Consumption**
  * [ ] Dynamic duty cycle: 5s scan / 55s sleep in standby mode.
  * [ ] Battery level monitoring and automatic throttling below 20% capacity.
* **[ ] NFR-2: Cryptographic Verification**
  * [ ] On-device Ed25519 asymmetric keypair generation.
  * [ ] Digital signature generation for all outgoing distress packets.
  * [ ] Signature verification and rejection of forged or altered packets.
* **[ ] NFR-3: Resilient Store-and-Forward Architecture**
  * [ ] Transactional local database storing transit packets across power cycles.
* **[ ] NFR-4: Strict Offline-First Operation**
  * [ ] Complete feature operation in Airplane Mode without SIM or Wi-Fi internet.

---

## 3. Milestone Tracking

| Milestone | Target Phase | Status | Completion Date |
| :--- | :---: | :---: | :---: |
| **M0: Documentation & Design Baseline** | Phase 0 | **COMPLETED** | Day 1 (Hour 02:00) |
| **M1: Compilable Project Skeleton on Hardware** | Phase 1 | PENDING | Target: Day 1 (Hour 04:30) |
| **M2: Emergency UI & Navigation Functional** | Phase 2 | PENDING | Target: Day 1 (Hour 07:30) |
| **M3: 1-Hop BLE P2P Packet Exchange Confirmed** | Phase 3 | PENDING | Target: Day 1 (Hour 11:30) |
| **M4: Offline Distress Beacon Generated with GPS** | Phase 4 | PENDING | Target: Day 1 (Hour 14:00) |
| **M5: 3-Node Multi-Hop Relay Operational** | Phase 5 | PENDING | Target: Day 1 (Hour 18:30) |
| **M6: Offline Map Rendering Pre-Cached Tiles** | Phase 6 | PENDING | Target: Day 1 (Hour 21:30) |
| **M7: Hazard Broadcast & Torch SOS Integrated** | Phases 7–8 | PENDING | Target: Day 2 (Hour 01:00) |
| **M8: Cryptographic Signatures & Flood Guard** | Phase 9 | PENDING | Target: Day 2 (Hour 03:30) |
| **M9: Multi-Device Testbed Verification** | Phase 10 | PENDING | Target: Day 2 (Hour 05:30) |
| **M10: Release APK Generated & Verified** | Phase 11 | PENDING | Target: Day 2 (Hour 07:00) |
| **M11: Live Demo & Defense Rehearsal** | Phase 12 | PENDING | Target: Day 2 (Hour 08:00) |

---

## 4. Known Blockers & Technical Risks

1. **Android 12+ Bluetooth Permissions:** Android 12 introduced `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, and `BLUETOOTH_CONNECT` as runtime permissions requiring explicit user approval. Mitigation: Design a prominent onboarding permission disclosure.
2. **Aggressive Background Killing (OEM Battery Managers):** Vendors (Xiaomi MIUI, Samsung OneUI) terminate background scanning services after minutes of screen lock. Mitigation: Android Foreground Service with continuous ongoing notification.
3. **Payload Fragmentation in Legacy BLE:** If devices negotiate legacy BLE 4.2 without Extended Advertising, packets are restricted to 31 bytes. Mitigation: Compact binary serialization format (MessagePack / Protobuf style packing).

---

## 5. Architectural & Technical Decisions Log

| Decision ID | Topic | Decision Made | Rationale & Alternatives Considered |
| :---: | :--- | :--- | :--- |
| **ADR-01** | Routing Topology | **Application-Layer Store-and-Forward (DTN)** | *Decision:* Implement routing at the app layer rather than expecting BLE/Wi-Fi to form an autonomous ad-hoc mesh. Standard mobile operating systems do not expose raw 802.11s or 6LoWPAN mesh kernels without root. |
| **ADR-02** | Primary Radio | **Bluetooth Low Energy (BLE)** | *Decision:* BLE chosen as primary discovery and routing radio due to low power consumption and rapid discovery. Wi-Fi Direct reserved as secondary high-bandwidth channel for batch sync. |
| **ADR-03** | Map Rendering | **Local Vector MBTiles / Static GeoJSON** | *Decision:* Store a localized bounding box vector cache locally. Discarded online tile servers or dynamic map fetching to guarantee 100% offline autonomy. |
| **ADR-04** | Cryptography | **Ed25519 Public-Key Signatures** | *Decision:* Ed25519 chosen for 64-byte compact signatures, fast verification on mobile ARM chips, and high resilience against forgery. |

---

## 6. Testing Results Section

> *Notice: No test suites have been executed yet. The application source code has not yet been built. The table below represents the test verification matrix to be populated during Phase 10.*

| Test ID | Test Scenario | Target Metric | Measured Result | Status |
| :---: | :--- | :---: | :---: | :---: |
| **TC-01** | BLE 1-Hop Discovery Latency | $< 15\text{ seconds}$ | *Not tested yet* | Pending |
| **TC-02** | 3-Node Multi-Hop Packet Delivery ($A \to B \to C$) | $100\%\text{ delivery}$ | *Not tested yet* | Pending |
| **TC-03** | Offline GPS Cold Fix in Airplane Mode | Coordinates captured | *Not tested yet* | Pending |
| **TC-04** | Offline Map Load Time (Zero Network) | $< 2.0\text{ seconds}$ | *Not tested yet* | Pending |
| **TC-05** | Morse SOS Flashlight Frequency Stability | $\pm 20\text{ ms precision}$ | *Not tested yet* | Pending |
| **TC-06** | Tampered Packet Signature Rejection | Dropped instantly | *Not tested yet* | Pending |
| **TC-07** | 2-Hour Idle Battery Consumption | $< 6\%\text{ battery drain}$ | *Not tested yet* | Pending |

---

## 7. Change Log

* **Version 1.0.0 (Phase 0 Baseline):**
  * Initialized documentation suite (`README.md`, `docs/PLANNING.md`, `docs/PROGRESS.md`, `docs/DEPLOYMENT.md`, `docs/DEFENSE_QA.md`).
  * Established baseline tracking tables, requirement matrices, and technical decision logs.
  * Code implementation status confirmed as **NOT STARTED**.
