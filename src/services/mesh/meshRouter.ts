/**
 * Application-Layer Mesh Router & Store-and-Forward Engine
 *
 * Implements:
 * - Opportunistic Store-and-Forward relay across intermediate nodes (A -> B -> C)
 * - Seen-message deduplication
 * - Hop-limit / TTL decrement protection
 * - Eligible peer selection and loop avoidance
 * - Automatic retry with backoff interval
 */

import {bleService, BlePeer} from '../ble';
import {meshStore} from './meshStore';
import {meshTransport} from './meshTransport';
import {
  DistressBeaconPayload,
  HazardBroadcastPayload,
  MeshMessage,
  MeshTelemetry,
  RETRY_BACKOFF_MS,
  StoredMeshMessage,
} from './types';

export class MeshRouterManager {
  private localNodeId = 'RESQ-MESH:----';
  private isRunning = false;
  private isForwardingInProgress = false;
  private onMessageReceivedListeners = new Set<(msg: MeshMessage) => void>();
  private onTelemetryUpdatedListeners = new Set<(telemetry: MeshTelemetry) => void>();
  private legacyMessageListener: ((msg: MeshMessage) => void) | null = null;
  private legacyTelemetryListener: ((telemetry: MeshTelemetry) => void) | null = null;

  /**
   * Initializes the Mesh Router, underlying store, and GATT transport.
   */
  public async initialize(localNodeId: string): Promise<void> {
    if (this.isRunning) return;

    this.localNodeId = localNodeId;

    // 1. Initialize persistent store from local storage
    await meshStore.initialize();

    // 2. Initialize GATT transport with packet reception handler
    const manager = bleService.getBleManager();
    if (manager) {
      await meshTransport.initialize(
        manager,
        (msg: MeshMessage, senderAddress?: string) => {
          this.handleIncomingMessage(msg, senderAddress);
        }
      );
    }

    // 3. Listen to store updates to notify UI telemetry listeners
    meshStore.setOnUpdateListener(() => {
      this.notifyTelemetry();
    });

    this.isRunning = true;
    this.notifyTelemetry();
  }

  /**
   * Updates local node ID if refreshed from native identity provider.
   */
  public updateLocalNodeId(id: string): void {
    this.localNodeId = id;
    this.notifyTelemetry();
  }

  /**
   * Registers UI listener for incoming messages (legacy single-listener API).
   */
  public setOnMessageReceived(listener: ((msg: MeshMessage) => void) | null): void {
    this.legacyMessageListener = listener;
  }

  /**
   * Registers multi-subscriber UI listener for incoming messages.
   * Returns an unsubscription function.
   */
  public addOnMessageReceivedListener(listener: (msg: MeshMessage) => void): () => void {
    this.onMessageReceivedListeners.add(listener);
    return () => {
      this.onMessageReceivedListeners.delete(listener);
    };
  }

  /**
   * Registers UI listener for telemetry updates (legacy single-listener API).
   */
  public setOnTelemetryUpdated(listener: ((telemetry: MeshTelemetry) => void) | null): void {
    this.legacyTelemetryListener = listener;
  }

  /**
   * Registers multi-subscriber UI listener for telemetry updates.
   * Returns an unsubscription function.
   */
  public addOnTelemetryUpdatedListener(listener: (telemetry: MeshTelemetry) => void): () => void {
    this.onTelemetryUpdatedListeners.add(listener);
    return () => {
      this.onTelemetryUpdatedListeners.delete(listener);
    };
  }

  /**
   * Broadcasts current telemetry to registered listeners.
   */
  private notifyTelemetry(): void {
    const telemetry = meshStore.getTelemetry(this.localNodeId);
    if (this.legacyTelemetryListener) {
      try {
        this.legacyTelemetryListener(telemetry);
      } catch (e) {
        console.warn('[MeshRouter] Error in legacy telemetry listener', e);
      }
    }
    this.onTelemetryUpdatedListeners.forEach(listener => {
      try {
        listener(telemetry);
      } catch (e) {
        console.warn('[MeshRouter] Error in telemetry listener', e);
      }
    });
  }

  /**
   * Handles incoming over-the-air MeshMessage from a peer.
   */
  public async handleIncomingMessage(
    message: MeshMessage,
    senderAddress?: string
  ): Promise<void> {
    console.log(
      `[MESH-RX] message received: msgId=${message.messageId} type=${message.messageType} origin=${message.originNodeId} dest=${message.destinationNodeId || 'BROADCAST'} localNodeId=${this.localNodeId} sender=${senderAddress || 'unknown'} ttl=${message.ttl} hops=${message.hopCount}`
    );

    // Rule 1: Deduplication check
    if (meshStore.hasSeen(message.messageId)) {
      console.log(`[MeshRouter] deduplication: message ${message.messageId} already seen, discarding`);
      return; // Discard duplicate immediately
    }

    if (message.messageType === 'DISTRESS_BEACON') {
      const payload = typeof message.payload === 'object' && message.payload !== null
        ? (message.payload as DistressBeaconPayload)
        : null;
      console.log(
        `[DISTRESS] [DISTRESS-RX] beacon received: msgId=${message.messageId} origin=${message.originNodeId} sender=${senderAddress || 'unknown'} type=${payload?.emergencyType} count=${payload?.count} notes=${payload?.notes} lat=${payload?.location?.latitude} lon=${payload?.location?.longitude}`
      );
    }

    if (message.messageType === 'HAZARD_BROADCAST') {
      const payload = typeof message.payload === 'object' && message.payload !== null
        ? (message.payload as HazardBroadcastPayload)
        : null;
      console.log(
        `[MeshRouter] HAZARD_BROADCAST received: type=${payload?.hazardType} severity=${payload?.severity} title=${payload?.title} msg=${payload?.message} lat=${payload?.location?.latitude} lon=${payload?.location?.longitude} acc=${payload?.location?.accuracy} ttl=${message.ttl} hops=${message.hopCount}`
      );
    }

    // Rule 2: Destination & Origin check
    const isDirectRecipient =
      message.destinationNodeId &&
      message.destinationNodeId === this.localNodeId;

    const isOriginatedBySelf = message.originNodeId === this.localNodeId;

    if (isOriginatedBySelf) {
      console.log(`[MeshRouter] loopback check: message ${message.messageId} originated by self (${message.originNodeId}), ignoring`);
      return; // Do not process self-generated loopback
    }

    // Rule 2.5: Silently process identity handshake / ACK frames without store pollution or alerts
    if (message.messageType === 'ACK' || message.payload === 'RESQ_NODE_HELLO') {
      meshStore.markSeen(message.messageId);
      console.log(`[MeshRouter] identity handshake/ACK processed from ${message.originNodeId}`);
      return;
    }

    console.log(`[MeshRouter] destination check: isDirectRecipient=${isDirectRecipient} ttl=${message.ttl}`);

    // Rule 3: Check TTL expiry
    if (message.ttl <= 1 && !isDirectRecipient) {
      // TTL exhausted; cannot relay further
      console.log(`[MeshRouter] TTL exhausted (ttl=${message.ttl}), storing as EXPIRED`);
      await meshStore.addIncomingMessage(message, senderAddress, 'EXPIRED');
      this.notifyTelemetry();
      return;
    }

    if (isDirectRecipient) {
      // Delivered to destination node!
      console.log(`[MeshRouter] message delivered to destination node, storing as DELIVERED`);
      await meshStore.addIncomingMessage(message, senderAddress, 'DELIVERED');
    } else {
      // Needs store-and-forward relay
      // Prepare relay envelope with decremented TTL and incremented hopCount
      const relayedCopy: MeshMessage = {
        ...message,
        ttl: message.ttl - 1,
        hopCount: message.hopCount + 1,
      };

      console.log(`[MeshRouter] message stored as PENDING for relay (new ttl=${relayedCopy.ttl}, hopCount=${relayedCopy.hopCount})`);
      await meshStore.addIncomingMessage(relayedCopy, senderAddress, 'PENDING');
    }

    // Notify UI listeners of newly arrived message
    if (this.legacyMessageListener) {
      console.log(`[MeshRouter] notifying UI listener for message ${message.messageId}`);
      try {
        this.legacyMessageListener(message);
      } catch (e) {
        console.warn('[MeshRouter] Error in legacyMessageListener', e);
      }
    }
    this.onMessageReceivedListeners.forEach(listener => {
      try {
        listener(message);
      } catch (e) {
        console.warn('[MeshRouter] Error in onMessageReceivedListener', e);
      }
    });

    this.notifyTelemetry();

    // Trigger immediate opportunistic forward attempt to available peers
    this.attemptForwardPending();
  }

  /**
   * Originates and enqueues a new message from this device.
   */
  public async sendOutgoingMessage(message: MeshMessage): Promise<StoredMeshMessage> {
    const stored = await meshStore.addOutgoingMessage(message);
    this.notifyTelemetry();

    // Trigger forwarding attempt
    this.attemptForwardPending();
    return stored;
  }

  /**
   * Creates and enqueues a Phase 4 test mesh message.
   */
  public async sendTestMessage(customText?: string): Promise<MeshMessage> {
    const testMsg = meshStore.createTestMessage(this.localNodeId, customText);
    await this.sendOutgoingMessage(testMsg);
    return testMsg;
  }

  /**
   * Creates and enqueues a DISTRESS_BEACON SOS packet with offline GPS coordinates.
   */
  public async sendDistressBeacon(payload: DistressBeaconPayload): Promise<MeshMessage> {
    const distressMsg = meshStore.createDistressBeacon(this.localNodeId, payload);
    console.log(
      `[DISTRESS] [DISTRESS-TX] originate beacon: msgId=${distressMsg.messageId} origin=${this.localNodeId} emergencyType=${payload.emergencyType} count=${payload.count} lat=${payload.location?.latitude} lon=${payload.location?.longitude}`
    );
    await this.sendOutgoingMessage(distressMsg);
    return distressMsg;
  }

  /**
   * Creates and enqueues a HAZARD_BROADCAST bulletin packet across the mesh.
   */
  public async sendHazardBroadcast(payload: HazardBroadcastPayload): Promise<MeshMessage> {
    const hazardMsg = meshStore.createHazardBroadcast(this.localNodeId, payload);
    await this.sendOutgoingMessage(hazardMsg);
    return hazardMsg;
  }

  private lastPeerConnectAttempt = new Map<string, number>();

  /**
   * Opportunistic Store-and-Forward pass:
   * Inspects pending messages and attempts transmission to eligible nearby peers.
   */
  public async attemptForwardPending(): Promise<void> {
    if (this.isForwardingInProgress) {
      console.log('[MeshRouter] forwarding already in progress, skipping overlapping run');
      return;
    }

    const pending = meshStore.getPendingMessages();
    console.log(`[MeshRouter] pending queue count: ${pending.length}`);
    if (pending.length === 0) return;

    // Read currently discovered peers from bleService (already sorted by connected status)
    const knownPeers: BlePeer[] = bleService.getDiscoveredPeers();

    // Separate active connected peers from unconnected candidates
    // Exclude any peer currently in the process of manual connecting
    const activePeers = knownPeers.filter(
      p =>
        (p.connectionState === 'connected' || bleService.isPeerConnected(p.id)) &&
        !bleService.isPeerConnecting(p.id)
    );

    const unconnectedResqPeers = knownPeers.filter(
      p =>
        p.isResqMeshPeer &&
        p.connectionState !== 'connected' &&
        !bleService.isPeerConnected(p.id) &&
        !bleService.isPeerConnecting(p.id) &&
        p.connectionState !== 'connecting'
    );

    // Prioritize active connected peers first; fall back to eligible unconnected peers
    const eligiblePeers = [...activePeers, ...unconnectedResqPeers];

    console.log(`[MeshRouter] eligible peer count: ${eligiblePeers.length} (active: ${activePeers.length}, unconnected: ${unconnectedResqPeers.length})`);
    if (eligiblePeers.length === 0) return;

    this.isForwardingInProgress = true;

    try {
      const now = Date.now();

      // Process pending messages sequentially (one by one)
      for (const item of pending) {
        // Skip if TTL exhausted
        if (item.message.ttl <= 0) {
          await meshStore.markExpired(item.message.messageId);
          continue;
        }

        // Retry backoff check: avoid tight retry loops on recent failure
        if (item.lastAttemptAt && now - item.lastAttemptAt < RETRY_BACKOFF_MS) {
          continue;
        }

        for (const peer of eligiblePeers) {
          const peerAddr = peer.id;

          // Rule: Never relay back to the immediate last-hop sender (anti-echo)
          if (item.lastHopSender && item.lastHopSender.toLowerCase() === peerAddr.toLowerCase()) {
            continue;
          }

          // Rule: Never relay back to the origin author of the packet
          if (
            peer.name === item.message.originNodeId ||
            peer.peerId === item.message.originNodeId
          ) {
            continue;
          }

          // Rule: Never send duplicate to same peer
          if (item.forwardedToPeers.includes(peerAddr)) {
            continue;
          }

          // If peer is unconnected, check cooldown to avoid rapid reconnect cycles
          const isPeerActive =
            peer.connectionState === 'connected' || bleService.isPeerConnected(peerAddr);

          if (!isPeerActive) {
            const lastAttempt = this.lastPeerConnectAttempt.get(peerAddr) || 0;
            if (now - lastAttempt < 15000) {
              // Less than 15s since last temporary connection attempt to this peer; skip
              continue;
            }
            // Also ensure manual CONNECT did not start while looping
            if (bleService.isPeerConnecting(peerAddr)) {
              continue;
            }
            this.lastPeerConnectAttempt.set(peerAddr, now);
          }

          console.log(`[MESH-TX] forward started: msgId=${item.message.messageId} type=${item.message.messageType} peer=${peer.id} (${peer.name}, state=${peer.connectionState})`);

          // Attempt sequential transmission
          const result = await meshTransport.transmitToPeer(peerAddr, item.message);

          if (result.success) {
            console.log(`[MESH-TX] forward succeeded: msgId=${item.message.messageId} peer=${peer.id}`);
            await meshStore.recordForwarded(item.message.messageId, peerAddr);
            break; // Move to next pending message once successfully forwarded
          } else {
            console.warn(`[MESH-TX] forward failed: msgId=${item.message.messageId} peer=${peer.id} error=${result.error}`);
            await meshStore.recordForwardFailed(
              item.message.messageId,
              result.error || 'Transport failed'
            );
          }
        }
      }
    } finally {
      this.isForwardingInProgress = false;
      this.notifyTelemetry();
    }
  }

  /**
   * Shuts down router and underlying transport.
   */
  public destroy(): void {
    meshTransport.destroy();
    meshStore.setOnUpdateListener(null);
    this.legacyMessageListener = null;
    this.legacyTelemetryListener = null;
    this.onMessageReceivedListeners.clear();
    this.onTelemetryUpdatedListeners.clear();
    this.isRunning = false;
  }
}

export const meshRouter = new MeshRouterManager();
