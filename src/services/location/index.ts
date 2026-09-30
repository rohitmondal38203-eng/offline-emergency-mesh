/**
 * Offline GNSS / GPS Location Service Placeholder
 * Target Phase: Phase 4 (Distress Beacon Generation)
 * Current Status: NOT IMPLEMENTED
 */

export const LocationService = {
  getOfflineGpsFix: async (): Promise<{latitude: number; longitude: number; accuracy: number}> => {
    throw new Error('LocationService.getOfflineGpsFix is planned for Phase 4 and not yet implemented.');
  },
};
