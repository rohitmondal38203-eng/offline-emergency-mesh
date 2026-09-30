/**
 * Offline Persistent Database / Storage Service Placeholder
 * Target Phase: Phase 4 & Phase 5 (Local queue persistence)
 * Current Status: NOT IMPLEMENTED
 */

export const StorageService = {
  savePacket: async (_packet: unknown): Promise<void> => {
    throw new Error('StorageService.savePacket is planned for future phases and not yet implemented.');
  },
  getPendingPackets: async (): Promise<unknown[]> => {
    return [];
  },
};
