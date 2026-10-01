/**
 * BLE GATT Mesh Message Transport & Chunking Protocol
 *
 * Framing Format:
 *   RESQ|<messageId>|<chunkIndex>|<totalChunks>|<chunkPayload>
 *
 * Characteristics:
 * - Chunk size tuned for BLE MTU constraints (120 bytes max per frame)
 * - Automatic reassembly with 15-second assembly timeout
 * - GATT Server listener via Android native module
 * - GATT Client writer via react-native-ble-plx
 */

import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';
import {bleService} from '../ble/bleService';
import {PeerIdentityService} from '../ble/peerIdentity';
import {
  MESH_CHARACTERISTIC_UUID,
  MESH_SERVICE_UUID,
  MeshMessage,
} from './types';

const {ResqBleAdvertiser} = NativeModules;

// Pure JS Base64 helper for bulletproof compatibility across React Native runtimes
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function base64Encode(input: string): string {
  let output = '';
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  let i = 0;

  // Convert string to UTF-8 byte stream
  const utf8Bytes: number[] = [];
  for (let j = 0; j < input.length; j++) {
    let c = input.charCodeAt(j);
    if (c < 128) {
      utf8Bytes.push(c);
    } else if (c < 2048) {
      utf8Bytes.push((c >> 6) | 192);
      utf8Bytes.push((c & 63) | 128);
    } else {
      utf8Bytes.push((c >> 12) | 224);
      utf8Bytes.push(((c >> 6) & 63) | 128);
      utf8Bytes.push((c & 63) | 128);
    }
  }

  while (i < utf8Bytes.length) {
    chr1 = utf8Bytes[i++];
    chr2 = utf8Bytes[i++];
    chr3 = utf8Bytes[i++];

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = isNaN(chr2) || isNaN(chr3) ? 64 : chr3 & 63;

    output +=
      B64_CHARS.charAt(enc1) +
      B64_CHARS.charAt(enc2) +
      B64_CHARS.charAt(enc3) +
      B64_CHARS.charAt(enc4);
  }
  return output;
}

function base64Decode(input: string): string {
  const cleanInput = input.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let i = 0;

  while (i < cleanInput.length) {
    const enc1 = B64_CHARS.indexOf(cleanInput.charAt(i++));
    const enc2 = B64_CHARS.indexOf(cleanInput.charAt(i++));
    const enc3 = B64_CHARS.indexOf(cleanInput.charAt(i++));
    const enc4 = B64_CHARS.indexOf(cleanInput.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);
    if (enc3 !== 64) bytes.push(chr2);
    if (enc4 !== 64) bytes.push(chr3);
  }

  // Convert UTF-8 bytes back to JavaScript string
  let str = '';
  let idx = 0;
  while (idx < bytes.length) {
    const b1 = bytes[idx++];
    if (b1 < 128) {
      str += String.fromCharCode(b1);
    } else if (b1 > 191 && b1 < 224) {
      const b2 = bytes[idx++];
      str += String.fromCharCode(((b1 & 31) << 6) | (b2 & 63));
    } else if (b1 >= 224 && b1 < 240) {
      const b2 = bytes[idx++];
      const b3 = bytes[idx++];
      str += String.fromCharCode(((b1 & 15) << 12) | ((b2 & 63) << 6) | (b3 & 63));
    } else if (b1 >= 240 && b1 <= 247) {
      const b2 = bytes[idx++];
      const b3 = bytes[idx++];
      const b4 = bytes[idx++];
      const codePoint = (((b1 & 7) << 18) | ((b2 & 63) << 12) | ((b3 & 63) << 6) | (b4 & 63));
      str += String.fromCodePoint(codePoint);
    }
  }
  return str;
}

interface AssemblyBuffer {
  messageId: string;
  totalChunks: number;
  chunks: (string | null)[];
  createdAt: number;
  senderAddress: string;
}

const CHUNK_PAYLOAD_SIZE = 120; // 120 bytes max payload per chunk
const ASSEMBLY_TIMEOUT_MS = 15000; // 15 seconds assembly timeout

export class MeshTransportManager {
  private bleManager: BleManager | null = null;
  private assemblyBuffers = new Map<string, AssemblyBuffer>();
  private onMessageReceivedCallback: ((msg: MeshMessage, senderAddress?: string) => void) | null = null;
  private isServerActive = false;

  /**
   * Initializes GATT Server hosting and registers native event listeners.
   */
  public async initialize(
    bleManager: BleManager,
    onMessageReceived: (msg: MeshMessage, senderAddress?: string) => void
  ): Promise<void> {
    this.bleManager = bleManager;
    this.onMessageReceivedCallback = onMessageReceived;

    // Start GATT Server on Android
    await this.ensureGattServer();

    // Subscribe to incoming GATT packets received by our native GATT Server
    DeviceEventEmitter.addListener('onMeshGattPacketReceived', (event: {
      senderAddress: string;
      data: string; // Base64 encoded packet
    }) => {
      this.handleIncomingRawPacket(event.senderAddress, event.data);
    });

    // Start periodic assembly cleanup timer
    setInterval(() => {
      this.cleanupStaleAssemblyBuffers();
    }, 10000);

    // Register automatic identity handshake upon BLE GATT connection
    bleService.setOnDeviceConnected((device: Device) => {
      this.sendIdentityHandshake(device).catch(() => {});
    });
  }

  /**
   * Transmits a lightweight identity handshake to the connected peer over GATT
   * so the remote GATT server registers our real RESQ-MESH node ID immediately.
   */
  public async sendIdentityHandshake(connectedDevice: Device): Promise<void> {
    try {
      const localId = await PeerIdentityService.getLocalPeerId();
      const handshakeMsg: MeshMessage = {
        messageId: `H_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        originNodeId: localId,
        messageType: 'ACK',
        createdAt: Date.now(),
        ttl: 1,
        hopCount: 0,
        payload: 'RESQ_NODE_HELLO',
      };
      console.log(`[BLE-TX] transmitting identity handshake to ${connectedDevice.id} (node=${localId})`);
      await this.transmitToPeer(connectedDevice.id, handshakeMsg);
      console.log(`[BLE-TX] identity handshake delivered to ${connectedDevice.id}`);
    } catch (e: any) {
      console.warn(`[BLE-TX] identity handshake note device=${connectedDevice.id}:`, e?.message || e);
    }
  }

  /**
   * Starts or confirms the native GATT server is listening for incoming packets.
   */
  public async ensureGattServer(): Promise<boolean> {
    if (Platform.OS !== 'android' || !ResqBleAdvertiser?.startGattServer) {
      return false;
    }
    try {
      console.log('[GattServer] START');
      await ResqBleAdvertiser.startGattServer(
        MESH_SERVICE_UUID,
        MESH_CHARACTERISTIC_UUID
      );
      this.isServerActive = true;
      console.log('[GattServer] GATT Server active on service', MESH_SERVICE_UUID);
      return true;
    } catch (e: any) {
      console.warn('[GattServer] startGattServer failed:', e?.message || e);
      return false;
    }
  }

  /**
   * Checks if local GATT server is running.
   */
  public getIsServerActive(): boolean {
    return this.isServerActive;
  }

  /**
   * Processes a raw GATT packet arriving from an over-the-air peer.
   */
  private handleIncomingRawPacket(senderAddress: string, base64Data: string): void {
    try {
      console.log(`[BLE-RX] raw packet received: sender=${senderAddress} base64Len=${base64Data?.length || 0} char=${MESH_CHARACTERISTIC_UUID}`);
      const decodedText = base64Decode(base64Data);
      console.log(`[BLE-RX] decoded frame prefix: "${decodedText.slice(0, 35)}" (totalLen=${decodedText.length})`);

      // Validate frame header: RESQ|<messageId>|<chunkIndex>|<totalChunks>|<chunkPayload>
      if (!decodedText.startsWith('RESQ|')) {
        console.warn(`[BLE-RX] ignored unrecognized frame header (not RESQ|): "${decodedText.slice(0, 30)}"`);
        return; // Ignore unrecognized packets
      }

      const parts = decodedText.split('|');
      if (parts.length < 5) {
        console.warn(`[BLE-RX] malformed frame parts: count=${parts.length}`);
        return; // Malformed frame
      }

      const messageId = parts[1];
      const chunkIndex = parseInt(parts[2], 10);
      const totalChunks = parseInt(parts[3], 10);
      const chunkPayload = parts.slice(4).join('|'); // Handle any pipe inside payload

      if (isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks <= 0) {
        console.warn(`[BLE-RX] invalid chunk indexing: chunkIndex=${parts[2]} totalChunks=${parts[3]}`);
        return;
      }

      console.log(`[BLE-RX] chunk received: peer=${senderAddress} msgId=${messageId} chunk=${chunkIndex + 1}/${totalChunks} payloadLen=${chunkPayload.length}`);

      // Single-chunk message optimization
      if (totalChunks === 1) {
        console.log(`[BLE-RX] single-chunk message ready: msgId=${messageId}`);
        this.parseAndDispatchMessage(chunkPayload, senderAddress);
        return;
      }

      // Multi-chunk reassembly
      let buffer = this.assemblyBuffers.get(messageId);
      if (!buffer) {
        buffer = {
          messageId,
          totalChunks,
          chunks: new Array(totalChunks).fill(null),
          createdAt: Date.now(),
          senderAddress,
        };
        this.assemblyBuffers.set(messageId, buffer);
      }

      buffer.chunks[chunkIndex] = chunkPayload;
      const arrivedCount = buffer.chunks.filter(c => c !== null).length;
      console.log(`[BLE-RX] multi-chunk reassembly progress: msgId=${messageId} chunks=${arrivedCount}/${totalChunks}`);

      // Check if all chunks have arrived
      const isComplete = buffer.chunks.every(c => c !== null);
      if (isComplete) {
        const fullPayload = buffer.chunks.join('');
        console.log(`[BLE-RX] reassembly completed: peer=${senderAddress} msgId=${messageId} totalChunks=${totalChunks} fullLen=${fullPayload.length}`);
        this.assemblyBuffers.delete(messageId);
        this.parseAndDispatchMessage(fullPayload, senderAddress);
      }
    } catch (e: any) {
      console.warn(`[BLE-RX] handleIncomingRawPacket error:`, e?.message || e);
    }
  }

  /**
   * Validates and parses the completed message string.
   */
  private parseAndDispatchMessage(jsonString: string, senderAddress: string): void {
    try {
      console.log(`[BLE-RX] parseAndDispatchMessage: jsonLen=${jsonString.length} preview="${jsonString.slice(0, 60)}"`);
      const obj = JSON.parse(jsonString);
      console.log(`[BLE-RX] parsed packet: type=${obj?.messageType} id=${obj?.messageId} origin=${obj?.originNodeId} sender=${senderAddress}`);

      if (
        obj &&
        typeof obj.messageId === 'string' &&
        typeof obj.originNodeId === 'string' &&
        typeof obj.ttl === 'number' &&
        typeof obj.hopCount === 'number' &&
        obj.payload !== undefined
      ) {
        const validMessage: MeshMessage = {
          messageId: obj.messageId,
          originNodeId: obj.originNodeId,
          destinationNodeId: obj.destinationNodeId,
          messageType: obj.messageType || 'TEST',
          createdAt: obj.createdAt || Date.now(),
          ttl: obj.ttl,
          hopCount: obj.hopCount,
          payload: obj.payload,
        };

        // Register sender's identity in BLE peer map for bidirectional communication
        bleService.registerPeerIdentity(senderAddress, validMessage.originNodeId);

        if (this.onMessageReceivedCallback) {
          console.log(`[BLE-RX] dispatching message ${validMessage.messageId} to meshRouter`);
          this.onMessageReceivedCallback(validMessage, senderAddress);
        } else {
          console.warn(`[BLE-RX] onMessageReceivedCallback is null!`);
        }
      } else {
        console.warn(`[BLE-RX] parsed JSON failed schema validation:`, obj);
      }
    } catch (e: any) {
      console.error(`[BLE-RX] JSON.parse failed on incoming payload:`, e?.message || e, `raw="${jsonString.slice(0, 100)}"`);
    }
  }

  /**
   * Cleans up partial chunk buffers that exceeded the 15-second assembly window.
   */
  private cleanupStaleAssemblyBuffers(): void {
    const now = Date.now();
    for (const [key, buffer] of this.assemblyBuffers.entries()) {
      if (now - buffer.createdAt > ASSEMBLY_TIMEOUT_MS) {
        this.assemblyBuffers.delete(key);
      }
    }
  }

  /**
   * Transmits a MeshMessage to a target BLE peer using GATT chunking.
   */
  public async transmitToPeer(
    peerAddress: string,
    message: MeshMessage
  ): Promise<{success: boolean; error?: string}> {
    if (!this.bleManager) {
      return {success: false, error: 'BleManager not initialized'};
    }

    console.log(
      `[BLE-TX] transmitToPeer target=${peerAddress} msgId=${message.messageId} type=${message.messageType} connState=${bleService.isPeerConnected(peerAddress) ? 'connected' : 'connecting'}`
    );

    let connectedDevice: Device | null = null;

    try {
      // Step 1: Check if peer is already actively connected via bleService
      const existingConn = bleService.getActiveDevice(peerAddress);
      if (existingConn) {
        connectedDevice = existingConn;
        console.log(`[BLE-TX] active connection reused peer=${peerAddress}`);
      } else {
        // Peer not in activeConnections: establish/obtain connection via bleService
        console.log(`[BLE-TX] establishing GATT client connection peer=${peerAddress}`);
        const connected = await bleService.connectToPeer(peerAddress);
        if (connected) {
          connectedDevice = bleService.getActiveDevice(peerAddress) || null;
        }

        if (!connectedDevice) {
          // Direct fallback attempt via bleManager with 30s timeout
          try {
            console.log(`[BLE-TX] direct connect fallback peer=${peerAddress}`);
            connectedDevice = await this.bleManager.connectToDevice(peerAddress, {
              autoConnect: false,
              timeout: 30000,
            });
            if (connectedDevice) {
              await connectedDevice.discoverAllServicesAndCharacteristics();
              await connectedDevice.requestConnectionPriority(1);
              bleService.registerActiveDevice(peerAddress, connectedDevice);
            }
          } catch (connErr: any) {
            console.warn(`[BLE-TX] direct connect fallback failed peer=${peerAddress}:`, connErr?.message || connErr);
          }
        }
      }

      if (!connectedDevice) {
        console.warn(`[BLE-TX] write failed: could not obtain connection to ${peerAddress}`);
        return {success: false, error: `Could not obtain connection to ${peerAddress}`};
      }

      // Step 2: Request MTU negotiation (best-effort on Android)
      try {
        await connectedDevice.requestMTU(256);
      } catch {}

      // Step 3: Discover all services and characteristics (safely cached)
      try {
        console.log(`[BLE-TX] DISCOVER_SERVICES peer=${peerAddress}`);
        await connectedDevice.discoverAllServicesAndCharacteristics();
        console.log(`[BLE-TX] discover characteristic ${MESH_CHARACTERISTIC_UUID}`);
      } catch {
        console.log(`[BLE-TX] services cached/ready peer=${peerAddress}`);
      }

      // Step 4: Serialize and slice into chunk frames
      const serialized = JSON.stringify(message);
      const totalChunks = Math.ceil(serialized.length / CHUNK_PAYLOAD_SIZE);
      const chunks: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const slice = serialized.substr(i * CHUNK_PAYLOAD_SIZE, CHUNK_PAYLOAD_SIZE);
        const frame = `RESQ|${message.messageId}|${i}|${totalChunks}|${slice}`;
        chunks.push(base64Encode(frame));
      }

      // Step 5: Sequential GATT write with response for guaranteed delivery
      console.log(`[BLE-TX] write started: peer=${peerAddress} msgId=${message.messageId} totalChunks=${totalChunks} char=${MESH_CHARACTERISTIC_UUID}`);
      for (let i = 0; i < chunks.length; i++) {
        console.log(`[BLE-TX] chunk ${i + 1}/${totalChunks} write started: peer=${peerAddress} msgId=${message.messageId}`);
        await connectedDevice.writeCharacteristicWithResponseForService(
          MESH_SERVICE_UUID,
          MESH_CHARACTERISTIC_UUID,
          chunks[i]
        );
        console.log(`[BLE-TX] chunk ${i + 1}/${totalChunks} write success: peer=${peerAddress} msgId=${message.messageId}`);
      }

      console.log(`[BLE-TX] write completed: peer=${peerAddress} msgId=${message.messageId} totalChunks=${totalChunks} write=SUCCESS`);
      return {success: true};
    } catch (e: any) {
      console.warn(`[BLE-TX] write failed: peer=${peerAddress} msgId=${message.messageId} char=${MESH_CHARACTERISTIC_UUID} write=FAILED error=${e?.message || String(e)}`);
      return {success: false, error: e?.message || String(e)};
    } finally {
      // Step 6: KEEP ACTIVE CONNECTION RETAINED!
      // Do NOT cancel active connection in finally block to avoid connection churn.
      console.log(`[BLE-TX] connection retained: peer=${peerAddress} connState=${bleService.isPeerConnected(peerAddress) ? 'connected' : 'idle'}`);
    }
  }

  /**
   * Shuts down GATT server and clears buffers.
   */
  public destroy(): void {
    console.log('[GattServer] STOP');
    if (Platform.OS === 'android' && ResqBleAdvertiser?.stopGattServer) {
      ResqBleAdvertiser.stopGattServer().catch(() => {});
    }
    this.assemblyBuffers.clear();
    this.onMessageReceivedCallback = null;
    this.isServerActive = false;
  }
}

export const meshTransport = new MeshTransportManager();
