# Phase 4 Documentation: Mesh Routing & Store-and-Forward Foundation

## 1. Executive Summary & Objective
Phase 4 implements the application-layer mesh networking engine for **APP-08 (RESQ-MESH)**.
While Phase 3 established physical 1-to-1 Bluetooth Low Energy (BLE) discovery and connection presence, Phase 4 enables **autonomous multi-hop message dissemination** without any cellular network, internet, backend server, or cloud connectivity.

---

## 2. Mesh Network Architecture

```
+-------------------------------------------------------------+
|                      React Native UI Layer                  |
|  - NearbyDevicesScreen: Live Mesh Telemetry & Test Action   |
|  - Real-time Queue Status: PENDING / FORWARDED / DELIVERED  |
+-------------------------------------------------------------+
                              ▲
                              │ Telemetry / State Updates
                              ▼
+-------------------------------------------------------------+
|               MeshRouterManager (meshRouter.ts)             |
|  - Opportunistic Store-and-Forward Engine                   |
|  - Hop Count Increment (hopCount + 1)                       |
|  - TTL Budget Decrement (ttl - 1)                           |
|  - Loop & Duplicate Suppression                             |
|  - Anti-Echo Rule (never relay to last-hop sender)          |
|  - Retry Backoff Management (5,000ms minimum interval)      |
+-------------------------------------------------------------+
            ▲                                    ▲
            │                                    │
            ▼                                    ▼
+-----------------------+            +------------------------+
| MeshStoreManager      |            | MeshTransportManager   |
| (meshStore.ts)        |            | (meshTransport.ts)     |
| - Memory Queue Map    |            | - GATT Chunking Engine |
| - Deduplication Set   |            | - Reassembly Buffers   |
| - Native File Bridge  |            | - Client GATT Writer   |
+-----------------------+            +------------------------+
            │                                    ▲
            ▼                                    ▼
+-------------------------------------------------------------+
|              Android Native Bridge (Kotlin)                 |
|  - ResqBleAdvertiserModule.kt                               |
|    • BluetoothGattServer (0000fd08 / 0000fd09)              |
|    • Local Storage: resq_mesh_store.json (filesDir)         |
|    • react-native-ble-plx Client GATT Writes                |
+-------------------------------------------------------------+
```

---

## 3. Standard Mesh Message Format

Every mesh packet adheres to the generic `MeshMessage` contract defined in `src/services/mesh/types.ts`:

```typescript
export interface MeshMessage {
  messageId: string;           // Format: <originNodeId>_<timestamp>_<4-hex-nonce>
  originNodeId: string;        // Originating node: RESQ-MESH:<4-HEX>
  destinationNodeId?: string;  // Destination node ID, or undefined for broadcast flood
  messageType: string;         // 'TEST', 'TEXT', 'DISTRESS_BEACON', 'HAZARD_BROADCAST'
  createdAt: number;           // Epoch timestamp in milliseconds
  ttl: number;                 // Remaining hop budget (starts at DEFAULT_TTL = 5)
  hopCount: number;            // Hops traversed so far (starts at 0)
  payload: Record<string, any> | string; // Generic JSON payload
}
```

### Key Field Design Decisions:
1. **`messageId`:** Formatted as `${originNodeId}_${timestamp}_${nonce}` (e.g., `RESQ-MESH:7F3A_1790800000000_A9B4`). This ensures global uniqueness across asynchronous disaster mesh nodes without centralized ID coordination.
2. **`ttl` (Time-To-Live):** Configured with a default of 5 (`DEFAULT_TTL = 5`). Decrements by 1 on every relay hop. When `ttl <= 1`, intermediate nodes mark the packet as `EXPIRED` and cease forwarding.
3. **`hopCount`:** Increments by 1 on every relay hop, measuring network diameter and transmission distance.
4. **`messageType`:** Kept generic so Phase 5 Distress Beacons and Phase 7 Hazard Broadcasts reuse the identical packet envelope.

---

## 4. Local Persistent Message Store (`meshStore.ts`)

* **Storage Engine:** Backed by an Android internal app sandbox file (`resq_mesh_store.json`) via `reactContext.filesDir` through `ResqBleAdvertiserModule.kt`.
* **Zero External DB Bloat:** No external SQLite or heavy database packages were introduced; the lightweight JSON serialization is 100% offline and crash-resilient.
* **Survives Restarts:** Messages and seen message IDs persist across full application force-stops and device reboots.
* **Status Lifecycle:**
  * `PENDING`: Message enqueued, awaiting transmission to an eligible in-range peer.
  * `FORWARDED`: Message successfully transmitted via BLE GATT to at least one relay peer.
  * `DELIVERED`: Message received by its intended destination node (or local node).
  * `EXPIRED`: Message hop budget exhausted (`ttl <= 0`) or age exceeded 24 hours.

---

## 5. Over-the-Air BLE GATT Message Transport

* **GATT Hosting (Server):**
  * Custom Android `BluetoothGattServer` opened via `ResqBleAdvertiserModule.kt`.
  * **Service UUID:** `0000fd08-0000-1000-8000-00805f9b34fb`
  * **Characteristic UUID:** `0000fd09-0000-1000-8000-00805f9b34fb`
  * Accepts GATT writes with response, acknowledges `GATT_SUCCESS`, and emits `onMeshGattPacketReceived` to React Native.
* **GATT Client (Writer):**
  * Uses `react-native-ble-plx` via `writeCharacteristicWithResponseForService`.
* **Framing & Chunking Protocol:**
  * Because BLE MTU varies between devices (default 23 bytes, typical negotiated 256–512 bytes), messages are sliced into 120-byte chunks.
  * Frame header format:
    ```
    RESQ|<messageId>|<chunkIndex>|<totalChunks>|<chunkPayload>
    ```
  * Single-chunk packets are decoded and parsed immediately.
  * Multi-chunk packets are buffered in `assemblyBuffers` and reassembled once all chunks `0..totalChunks-1` arrive.
  * A 15-second garbage collection timer purges incomplete chunks from dropped connections.

---

## 6. Deduplication & Anti-Looping Rules

1. **Seen-Message Cache:**
   * A persistent `Set<string>` caches the last 1,000 processed `messageId` values.
   * If an incoming packet's `messageId` exists in `seenIds`, the packet is dropped immediately.
2. **Loop Suppression:**
   * The same packet is never relayed between Phone A and Phone B in an endless echo.
   * Intermediate nodes record `lastHopSender` (the peer address that directly delivered the packet). Nodes will **never relay a packet back to the peer that just sent it**.
3. **Targeted Delivery Tracking:**
   * Each stored message maintains `forwardedToPeers: string[]`. Once successfully sent to a specific peer MAC, it is never transmitted to that peer again.
4. **Retry Backoff:**
   * A 5,000ms minimum interval (`RETRY_BACKOFF_MS`) prevents tight-loop retries when transmission to an out-of-range peer fails.

---

## 7. Three-Node Design Target ($A \to B \to C$)

The architecture is explicitly constructed to support delayed store-and-forward across 3 nodes:

```
+------------+               +------------+               +------------+
|  Phone A   |   BLE GATT    |  Phone B   |   BLE GATT    |  Phone C   |
|  (Origin)  | ------------> |  (Relay)   | ------------> | (Recipient)|
+------------+               +------------+               +------------+
  Creates:                     Receives A:                  Receives B:
  ID: A_100_01                 Persists A                   Recognizes:
  HopCount: 0                  HopCount: 1                  Origin: A
  TTL: 5                       TTL: 4                       HopCount: 2
                               Status: PENDING              TTL: 3
                               Relays to C when in range    Status: DELIVERED
```

* **No Simultaneous Link Requirement:** Phone A and Phone C do not need to be in range of each other, nor do Phone A and Phone B need to remain connected when Phone B reaches Phone C.
* Node B stores the packet in `PENDING` state until Phone C is discovered, then forwards it.

---

## 8. Build & Verification Status

1. **TypeScript Check:** `npm run typecheck` passed with **0 errors**.
2. **Static Bundle:** `android/app/src/main/assets/index.android.bundle` compiled cleanly (`976 KB`).
3. **Android Gradle Build:** `.\gradlew.bat assembleDebug` completed with **BUILD SUCCESSFUL in 10s**.
4. **Physical Phone Installation:** Streamed install to Xiaomi Redmi (`26eee2d2f62c`, Android 13) succeeded.
5. **App Launch & UI:** Tested on device:
   * Phase 3 BLE scanning & advertising functions cleanly.
   * Phase 4 Mesh Routing telemetry renders live packet counters.
   * "SEND TEST MESH MESSAGE" enqueues standardized `TEST` packets.
   * Native file persistence verified across force-stop and relaunch.

---

## 9. What Remains for Phase 5
1. Emergency classification form & headcount serialization.
2. Offline GNSS fix acquisition (hardware latitude/longitude).
3. Distress Beacon schema validation (`DISTRESS_BEACON`).
4. Automatic priority queueing for emergency SOS beacons over general mesh traffic.
