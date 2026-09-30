# APP-08 — Offline-First Disaster Emergency Mesh & Hazard Broadcast App

> **Current Phase:** Phase 0 — Documentation & Architecture Design  
> **Implementation Status:** Architecture and specifications defined. Application source code and hardware integrations are currently **UNDER ACTIVE DEVELOPMENT / NOT YET IMPLEMENTED**.

---

## 1. Executive Summary & Problem Statement

During catastrophic natural disasters—such as severe flash floods, Category 4/5 tropical cyclones, earthquakes, and landslides—conventional telecommunication infrastructure is often the first casualty. Power grids fail, cellular towers lose power or backhaul fiber connections, and commercial Internet Service Providers (ISPs) go dark. 

In this critical zero-connectivity window:
- **Victims become isolated:** Civilians trapped in collapsed structures, rising floodwaters, or remote pockets cannot transmit distress signals, headcount, or medical needs.
- **First responders operate blind:** Emergency management authorities, NDRF/SDRF teams, and local volunteers lack situational awareness regarding survivor clusters, road blockages, and resource requirements.
- **Panic amplifies risk:** Rumors and outdated safety notices spread without verified local broadcast channels.

**APP-08** is an offline-first disaster emergency communication system engineered to transform standard consumer Android smartphones into an ad-hoc peer-to-peer (P2P) wireless mesh network using short-range radios (**Bluetooth Low Energy** and **Wi-Fi Direct**). The system enables trapped victims and first responders to propagate life-saving distress beacons, exchange localized hazard bulletins, view offline emergency maps, and signal rescue teams visually—without cellular towers, SIM cards, or active internet access.

---

## 2. Real-World Disaster Scenario

```
           [ FLOOD / CYCLONE CRISIS ZONE: ZERO CELLULAR / ZERO INTERNET ]
                                        
   [Victim A: Trapped / Flood]            [Victim B: Relay Node]             [Node C: First Responder]
  (BLE / Wi-Fi Direct Beacon)  ------->  (Store & Forward Cache)  ------->  (Triage Dashboard / Uplink)
   - Status: Trapped                      - Relays Packet                    - Receives Victim A Payload
   - Headcount: 4 (1 Infant)              - Deduplicates Payload             - Marks Map Coordinates
   - Offline GPS Fix                      - Hops: 1                          - Dispatches Rescue Boat
```

1. **Hour 0 (Disaster Strikes):** A cyclone makes landfall. Sub-stations flood and 95% of cell towers collapse within a 40 km radius.
2. **Hour 2 (Isolation):** Victim A is trapped on a second-story terrace with 4 family members as water levels rise. Phone has no cellular signal.
3. **Hour 3 (Distress Beacon Generation):** Victim A opens APP-08, selects **"Trapped"**, specifies **Headcount: 4**, notes **"Need medical assistance for elderly person"**, and hits **Request Rescue**. The app acquires a raw satellite-based GPS fix and serializes a signed, encrypted distress beacon.
4. **Hour 4 (Multi-Hop Opportunistic Relay):** Victim B, located 60 meters away on higher ground, has APP-08 active in background scanning mode. Victim B's device receives Victim A's distress packet via BLE, caches it in local persistent storage, and forwards it to surrounding devices.
5. **Hour 5 (Triage Delivery):** A disaster relief reconnaissance boat carrying First Responder C moves along the flood canal. C's device detects B's node over Wi-Fi Direct, receives the multi-hop packet, decodes Victim A's distress beacon, and visualizes Victim A's coordinates and headcount on an offline topography map.

---

## 3. Target Users

| User Persona | Context / Role | Key Needs |
| :--- | :--- | :--- |
| **Trapped Civilians / Victims** | Zero connectivity, limited battery, extreme stress, potential physical injury. | One-touch distress beacon, headcount input, offline GPS latching, visual SOS beacon for night rescue. |
| **First Responders & Relief Teams** | NDRF, SDRF, military rescue, medical volunteers, firefighters. | Mesh triage monitor, real-time victim location mapping, ability to broadcast verified hazard bulletins (e.g., safe shelters, water distribution). |
| **Community Relay Volunteers** | Residents in partially affected zones acting as human transport relays. | Low-battery background forwarding, store-and-forward persistence, transparent privacy. |

---

## 4. Key Features Mapped to Functional Requirements

The core architecture directly maps to the requirements specified in the official hackathon problem statement:

| Requirement ID | Feature Name | Description | Status |
| :--- | :--- | :--- | :--- |
| **FR-1** | **P2P Mesh Network Initialization** | Discovery and pairing of nearby peer devices over Bluetooth Low Energy (BLE) advertisements and/or Wi-Fi Direct peer groups without external infrastructure or internet access. | Planned |
| **FR-2** | **Multi-Hop Distress Packet Relay** | Application-layer store-and-forward routing engine enabling packets to propagate opportunistically across intermediate nodes ($Node_A \to Node_B \to Node_C$) until arriving at an emergency responder or uplink node. | Planned |
| **FR-3** | **Distress Beacon Generation** | Generation of standardized distress packets including severity level (*Medical Emergency*, *Food/Water Shortage*, *Trapped*), headcount tally, timestamp, and offline GPS coordinates. | Planned |
| **FR-4** | **Offline Vector Map** | Embedded offline map rendering engine displaying pre-cached local-area vector tiles, safe zones, high-ground elevations, and designated emergency relief shelters. | Planned |
| **FR-5** | **Local Hazard Broadcast** | Cryptographically signed, mesh-wide broadcast updates authored by authorized first responders (e.g., "Water tanker stationed at Town Hall", "Bridge washed out at River Road"). | Planned |
| **FR-6** | **Emergency Flashlight SOS Strobe** | Hardware-level camera LED strobe patterned to international Morse Code SOS ($\cdot\cdot\cdot ---\ \cdot\cdot\cdot$) to enhance visual spotting by nighttime search-and-rescue teams and drones. | Planned |

---

## 5. Non-Functional Requirements (NFR)

* **NFR-1: Ultra-Low Battery Consumption:** Dynamically tuned BLE advertisement and scan duty cycles (e.g., 5 seconds active scan every 60 seconds during deep power-save) to preserve device battery life over multiple days.
* **NFR-2: Cryptographic Verification & Anti-Tamper:** Public-key cryptography (Ed25519) to digitally sign hazard broadcasts and emergency beacons, preventing forged alerts, rogue beacons, and man-in-the-middle tampering.
* **NFR-3: Resilient Store-and-Forward Architecture:** On-device persistent queue (embedded transactional database) to store transit packets indefinitely until new peer encounters occur (Delay-Tolerant Networking / DTN).
* **NFR-4: Strict Offline-First Operation:** 100% of application capabilities (UI, local storage, map tile rendering, radio communications, and cryptographic verification) must operate without any external network dependency.

---

## 6. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                            APP-08 APPLICATION LAYER                               |
|                                                                                   |
|  +--------------------+   +--------------------+   +---------------------------+  |
|  |   Beacon Creator   |   |  Offline Map View  |   |   Hazard Broadcast Feed   |  |
|  | (Status/Headcount) |   | (Cached GeoJSON)   |   |   (Verified Alerts)       |  |
|  +---------+----------+   +---------+----------+   +-------------+-------------+  |
|            |                        |                            |                |
|  +---------v------------------------v----------------------------v-------------+  |
|  |                 DISASTER EVENT MANAGER & LOCAL STATE ENGINE                 |  |
|  +----------------------------------+------------------------------------------+  |
+-------------------------------------|---------------------------------------------+
                                      |
+-------------------------------------v---------------------------------------------+
|                      SECURITY & DATA SERIALIZATION LAYER                          |
|                                                                                   |
|  +------------------------------------+   +------------------------------------+  |
|  |     Ed25519 Signature & KeyStore   |   |   Compact Binary/JSON Packetizer   |  |
|  |  (Beacon validation & anti-replay) |   |     (UUID, TTL, Seq, Payload)      |  |
|  +------------------------------------+   +------------------------------------+  |
+-------------------------------------+---------------------------------------------+
                                      |
+-------------------------------------v---------------------------------------------+
|               OPPORTUNISTIC ROUTING & STORE-AND-FORWARD ENGINE                    |
|                                                                                   |
|  +------------------------------------+   +------------------------------------+  |
|  |     SQLite / WatermelonDB Cache    |   |     Routing / Deduplication Cache  |  |
|  | (Persistent queue for DTN packets) |   |    (Seen packet IDs, TTL decrement)|  |
|  +------------------------------------+   +------------------------------------+  |
+-------------------------------------+---------------------------------------------+
                                      |
+-------------------------------------v---------------------------------------------+
|                     HARDWARE ABSTRACTION & RADIO ADAPTERS                         |
|                                                                                   |
|  +------------------+   +--------------------+  +---------------+  +-----------+  |
|  | BLE Advertiser / |   | Wi-Fi Direct       |  | Offline GNSS  |  | Camera2   |  |
|  | Scanner Engine   |   | P2P Group Manager  |  | GPS Receiver  |  | Torch SOS |  |
|  +------------------+   +--------------------+  +---------------+  +-----------+  |
+-----------------------------------------------------------------------------------+
```

### Network Reality Note
Standard Bluetooth Low Energy (BLE) and Wi-Fi Direct **do not natively implement self-healing multi-hop mesh routing**. They provide point-to-point and star/group topologies. The multi-hop relay functionality in APP-08 is implemented at the **application/network layer** using a managed Store-and-Forward / Epidemic Dissemination model with controlled Time-To-Live (TTL) and Bloom filter / hash-based deduplication.

---

## 7. Technology Stack (Finalized in Phase 1)

| Component | Finalized Technology | Status / Rationale |
| :--- | :--- | :--- |
| **Mobile Core Framework** | **React Native (v0.73.6) + TypeScript (v5.0.4)** | Configured & initialized in Phase 1. Native Android module bridging for BLE/Wi-Fi Direct. |
| **Mobile Target Platform** | **Android (API Level 26+ / Compile SDK 34)** | Configured in Gradle baseline (`android/app/build.gradle`). |
| **P2P Radios** | Native Android BLE API (`android.bluetooth.le`) & Wi-Fi P2P (`android.net.wifi.p2p`) | Planned for Phase 3. Native GATT server, L2CAP channels, and Wi-Fi Direct group owner negotiation. |
| **Local Offline Storage** | SQLite / WatermelonDB / MMKV | Planned for Phase 4/5. Transactional consistency for packet queues. |
| **Offline Mapping Engine** | MapLibre Native / Leaflet with local vector/raster MBTiles | Planned for Phase 6. Complete offline rendering of OpenStreetMap vector tiles from local assets. |
| **Cryptography** | TweetNaCl / libsodium (Ed25519, SHA-256) | Planned for Phase 9. Lightweight public-key signing and packet verification. |
| **Hardware APIs** | Android `CameraManager` (Torch Mode), Android `LocationManager` (Raw GNSS) | Planned for Phase 4/8. Direct hardware control for Morse SOS and satellite GNSS fixes. |


---

## 8. Security & Reliability Considerations

### Security
* **Anti-Spoofing & Beacon Authenticity:** Each device generates an asymmetric keypair (Ed25519) on initial launch, persisted in the secure hardware-backed Android Keystore. All distress beacons and hazard broadcasts are digitally signed.
* **First Responder Verification:** Hazard bulletins require authorization signatures matching pre-seeded or out-of-band verified public keys of accredited emergency relief agencies to prevent malicious rumors or panic generation.
* **Anti-Replay Protection:** Every packet header carries a monotonically increasing sequence counter, timestamp, and unique random nonce to prevent replay attacks.
* **Privacy Controls:** Distress beacons transmit only emergency classification, headcount, and coordinates. Personally Identifiable Information (PII) is omitted by default.

### Reliability & Resiliency
* **Battery-Adaptive Duty Cycles:** Dynamic radio throttling transitions the app between *Aggressive Discovery* (when transmitting an urgent beacon) and *Power-Saver Duty Cycle* (when operating as an idle transit relay node).
* **Controlled Packet Flooding:** To prevent broadcast storms in dense survivor clusters, packets enforce a maximum Time-To-Live (TTL $\le 5$), hop count tracking, and persistent cache deduplication.
* **Crash-Resilient Persistence:** Packet transit state is committed to disk before radio broadcast acknowledgement, preventing packet loss during sudden OS termination or battery exhaustion.

---

## 9. Project Status

```
[ Phase 0: Completed ] ──> [ Phase 1: Project Setup ] ──> [ Phase 2-12: Under Development ]
```

* **Current State:** Comprehensive architectural planning, interface design, threat modeling, and deployment roadmaps are complete.
* **Source Code Implementation:** **Not yet started**.
* **Prototype Demonstrations:** Planned for subsequent hackathon development milestones.

---

## 10. Future Scope

* **External LoRa / Satellite Bridge:** Integration with low-cost $433\text{ MHz} / 915\text{ MHz}$ LoRa hardware bridges (e.g., Meshtastic, ESP32) for multi-kilometer rural distress transmission.
* **Audio Chirp Signaling:** Ultrasonic/acoustic data transmission using device microphones and speakers for legacy devices without functional BLE.
* **Automated Triage AI:** Local on-device NLP clustering to aggregate distress messages and prioritize medical emergencies for search and rescue command centers.

---

## 11. How the Project Will Eventually Be Run / Built

*(Planned workflow once project setup is completed)*

### Prerequisites (Planned)
* Node.js (LTS) & Yarn / npm (for React Native) OR Flutter SDK
* Android Studio (Giraffe / Hedgehog or later)
* Android SDK 34, Build Tools, Platform Tools
* Minimum 2 Physical Android test devices (Android 8.0+ / API 26+) with BLE and Wi-Fi Direct hardware support.

### Planned Execution Steps
```bash
# 1. Clone repository
git clone https://github.com/placeholder-team/APP-08-Disaster-Mesh.git
cd APP-08-Disaster-Mesh

# 2. Install project dependencies (to be finalized in Phase 1)
# npm install / yarn install / flutter pub get

# 3. Build & launch on connected physical devices
# npx react-native run-android --mode=debug
# OR flutter run -d <device_id>
```

---

## 12. Team & Hackathon Contributors

* **Team Name:** [Team Placeholder]
* **Hackathon Track:** Disaster Management / Offline Communications (APP-08)
* **Team Members:**
  * Member 1: *Lead Systems & Mesh Protocol Engineer* — [Name / GitHub Placeholder]
  * Member 2: *Mobile Frontend & Offline Mapping Engineer* — [Name / GitHub Placeholder]
  * Member 3: *Hardware Bridges & Radio Integrations* — [Name / GitHub Placeholder]
  * Member 4: *Security, Cryptography & Triage UX* — [Name / GitHub Placeholder]

---
*Disclaimer: This repository currently contains architectural specifications, deployment documentation, and engineering blueprints for hackathon submission APP-08. Application source code is under active phased implementation.*
