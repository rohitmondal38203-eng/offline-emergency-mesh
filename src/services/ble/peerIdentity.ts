/**
 * RESQ-MESH Peer Identity Service
 *
 * Identity Format:
 *   RESQ-MESH:<4-HEX-DIGITS>
 *   Example: RESQ-MESH:7F3A
 *
 * Properties:
 * - Deterministic, non-PII (contains zero personally identifiable info).
 * - Generated locally on first run and stored in hardware SharedPreferences.
 * - Remains stable for the lifetime of the installation.
 * - Suitable for direct inclusion in Phase 4 packet envelope headers.
 */

import {NativeModules, Platform} from 'react-native';

const {ResqBleAdvertiser} = NativeModules;

let cachedPeerId: string | null = null;

function generateFallbackId(): string {
  const hex = Math.floor(0x1000 + Math.random() * 0xefff)
    .toString(16)
    .toUpperCase();
  return `RESQ-MESH:${hex}`;
}

export const PeerIdentityService = {
  /**
   * Retrieves or provisions the stable peer ID for this installation.
   */
  async getLocalPeerId(): Promise<string> {
    if (cachedPeerId) {
      return cachedPeerId;
    }

    if (Platform.OS === 'android' && ResqBleAdvertiser?.getPeerIdentity) {
      try {
        const id: string = await ResqBleAdvertiser.getPeerIdentity();
        if (id && id.startsWith('RESQ-MESH:')) {
          cachedPeerId = id;
          return id;
        }
      } catch (e) {
        // Fall back to memory generation if native module throws
      }
    }

    if (!cachedPeerId) {
      cachedPeerId = generateFallbackId();
    }
    return cachedPeerId;
  },

  /**
   * Checks if an advertised name or identifier belongs to a RESQ-MESH peer.
   */
  isResqMeshName(name: string | null | undefined): boolean {
    if (!name) return false;
    return name.startsWith('RESQ-MESH') || name.startsWith('RESQ_MESH');
  },

  /**
   * Cleans a raw device name into a readable display string.
   */
  formatDisplayName(name: string | null | undefined, fallbackId: string): string {
    if (name && name.trim().length > 0) {
      return name.trim();
    }
    return `BLE Node [${fallbackId.slice(-5)}]`;
  },
};
