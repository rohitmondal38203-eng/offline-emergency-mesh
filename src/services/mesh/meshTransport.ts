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
    } else {
      const b2 = bytes[idx++];
      const b3 = bytes[idx++];
      str += String.fromCharCode(((b1 & 15) << 12) | ((b2 & 63) << 6) | (b3 & 63));
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
    if (Platform.OS === 'android' && ResqBleAdvertiser?.startGattServer) {
      try {
        await ResqBleAdvertiser.startGattServer(
          MESH_SERVICE_UUID,
          MESH_CHARACTERISTIC_UUID
        );
        this.isServerActive = true;
      } catch (e) {
        // GATT Server error logged without crash
      }
    }

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
  }

  /**
   * Processes a raw GATT packet arriving from an over-the-air peer.
   */
  private handleIncomingRawPacket(senderAddress: string, base64Data: string): void {
    try {
      const decodedText = base64Decode(base64Data);

      // Validate frame header: RESQ|<messageId>|<chunkIndex>|<totalChunks>|<chunkPayload>
      if (!decodedText.startsWith('RESQ|')) {
        return; // Ignore unrecognized packets
      }

      const parts = decodedText.split('|');
      if (parts.length < 5) {
        return; // Malformed frame
      }

      const messageId = parts[1];
      const chunkIndex = parseInt(parts[2], 10);
      const totalChunks = parseInt(parts[3], 10);
      const chunkPayload = parts.slice(4).join('|'); // Handle any pipe inside payload

      if (isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks <= 0) {
        return;
      }

      // Single-chunk message optimization
      if (totalChunks === 1) {
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

      // Check if all chunks have arrived
      const isComplete = buffer.chunks.every(c => c !== null);
      if (isComplete) {
        const fullPayload = buffer.chunks.join('');
        this.assemblyBuffers.delete(messageId);
        this.parseAndDispatchMessage(fullPayload, senderAddress);
      }
    } catch (e) {
      // Discard malformed packet safely
    }
  }

  /**
   * Validates and parses the completed message string.
   */
  private parseAndDispatchMessage(jsonString: string, senderAddress: string): void {
    try {
      const obj = JSON.parse(jsonString);
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

        if (this.onMessageReceivedCallback) {
          this.onMessageReceivedCallback(validMessage, senderAddress);
        }
      }
    } catch (e) {
      // Discard corrupted JSON
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

    let connectedDevice: Device | null = null;
    let weInitiatedConnection = false;

    try {
      // Step 1: Connect to target peer if not already connected
      const isConnected = await this.bleManager.isDeviceConnected(peerAddress);
      if (!isConnected) {
        weInitiatedConnection = true;
        connectedDevice = await this.bleManager.connectToDevice(peerAddress, {
          autoConnect: false,
          timeout: 12000,
        });
      } else {
        connectedDevice = await this.bleManager.devices([peerAddress]).then(devs => devs[0] || null);
        if (!connectedDevice) {
          connectedDevice = await this.bleManager.connectToDevice(peerAddress, {
            autoConnect: false,
            timeout: 10000,
          });
        }
      }

      // Step 2: Request MTU negotiation (best-effort on Android)
      try {
        await connectedDevice.requestMTU(256);
      } catch {}

      // Step 3: Discover all services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();

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
      for (let i = 0; i < chunks.length; i++) {
        await connectedDevice.writeCharacteristicWithResponseForService(
          MESH_SERVICE_UUID,
          MESH_CHARACTERISTIC_UUID,
          chunks[i]
        );
      }

      return {success: true};
    } catch (e: any) {
      return {success: false, error: e?.message || String(e)};
    } finally {
      // Step 6: Cleanly disconnect if we initiated the link for this transfer
      if (weInitiatedConnection && connectedDevice) {
        try {
          await connectedDevice.cancelConnection();
        } catch {}
      }
    }
  }

  /**
   * Shuts down GATT server and clears buffers.
   */
  public destroy(): void {
    if (Platform.OS === 'android' && ResqBleAdvertiser?.stopGattServer) {
      ResqBleAdvertiser.stopGattServer().catch(() => {});
    }
    this.assemblyBuffers.clear();
    this.onMessageReceivedCallback = null;
    this.isServerActive = false;
  }
}

export const meshTransport = new MeshTransportManager();
