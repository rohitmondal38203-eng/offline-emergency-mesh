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
  MeshMessage,
  MeshTelemetry,
  RETRY_BACKOFF_MS,
  StoredMeshMessage,
} from './types';

export class MeshRouterManager {
  private localNodeId = 'RESQ-MESH:----';
  private isRunning = false;
  private isForwardingInProgress = false;
  private onMessageReceivedListener: ((msg: MeshMessage) => void) | null = null;
  private onTelemetryUpdatedListener: ((telemetry: MeshTelemetry) => void) | null = null;

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
   * Registers UI listener for incoming messages.
   */
  public setOnMessageReceived(listener: ((msg: MeshMessage) => void) | null): void {
    this.onMessageReceivedListener = listener;
  }

  /**
   * Registers UI listener for telemetry updates.
   */
  public setOnTelemetryUpdated(listener: ((telemetry: MeshTelemetry) => void) | null): void {
    this.onTelemetryUpdatedListener = listener;
  }

  /**
   * Broadcasts current telemetry to registered listeners.
   */
  private notifyTelemetry(): void {
    if (!this.onTelemetryUpdatedListener) return;
    const telemetry = meshStore.getTelemetry(this.localNodeId);
    this.onTelemetryUpdatedListener(telemetry);
  }

  /**
   * Handles incoming over-the-air MeshMessage from a peer.
   */
  public async handleIncomingMessage(
    message: MeshMessage,
    senderAddress?: string
  ): Promise<void> {
    // Rule 1: Deduplication check
    if (meshStore.hasSeen(message.messageId)) {
      return; // Discard duplicate immediately
    }

    // Mark seen in cache
    meshStore.markSeen(message.messageId);

    // Rule 2: Destination check
    const isDirectRecipient =
      message.destinationNodeId &&
      message.destinationNodeId === this.localNodeId;

    const isOriginatedBySelf = message.originNodeId === this.localNodeId;

    if (isOriginatedBySelf) {
      return; // Do not process self-generated loopback
    }

    // Rule 3: Check TTL expiry
    if (message.ttl <= 1 && !isDirectRecipient) {
      // TTL exhausted; cannot relay further
      await meshStore.addIncomingMessage(message, senderAddress, 'EXPIRED');
      this.notifyTelemetry();
      return;
    }

    if (isDirectRecipient) {
      // Delivered to destination node!
      await meshStore.addIncomingMessage(message, senderAddress, 'DELIVERED');
    } else {
      // Needs store-and-forward relay
      // Prepare relay envelope with decremented TTL and incremented hopCount
      const relayedCopy: MeshMessage = {
        ...message,
        ttl: message.ttl - 1,
        hopCount: message.hopCount + 1,
      };

      await meshStore.addIncomingMessage(relayedCopy, senderAddress, 'PENDING');
    }

    // Notify UI listener of newly arrived message
    if (this.onMessageReceivedListener) {
      this.onMessageReceivedListener(message);
    }

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
   * Opportunistic Store-and-Forward pass:
   * Inspects pending messages and attempts transmission to eligible nearby peers.
   */
  public async attemptForwardPending(): Promise<void> {
    if (this.isForwardingInProgress) return;

    const pending = meshStore.getPendingMessages();
    if (pending.length === 0) return;

    // Read currently discovered peers from bleService
    const knownPeers: BlePeer[] = bleService.getDiscoveredPeers();

    if (knownPeers.length === 0) return;

    this.isForwardingInProgress = true;

    try {
      const now = Date.now();

      for (const item of pending) {
        // Skip if TTL exhausted
        if (item.message.ttl <= 0) {
          await meshStore.markExpired(item.message.messageId);
          continue;
        }

        // Find eligible peer:
        // 1. Not the peer that delivered this packet directly to us (anti-echo)
        // 2. Not already forwarded to this peer
        // 3. Not in backoff penalty
        for (const peer of knownPeers) {
          const peerAddr = peer.id;

          // Rule: Never relay back to the immediate last-hop sender
          if (item.lastHopSender && item.lastHopSender.toLowerCase() === peerAddr.toLowerCase()) {
            continue;
          }

          // Rule: Never send duplicate to same peer
          if (item.forwardedToPeers.includes(peerAddr)) {
            continue;
          }

          // Rule: Retry backoff check (avoid tight retry loop)
          if (item.lastAttemptAt && now - item.lastAttemptAt < RETRY_BACKOFF_MS) {
            continue;
          }

          // Attempt transmission
          const result = await meshTransport.transmitToPeer(peerAddr, item.message);

          if (result.success) {
            await meshStore.recordForwarded(item.message.messageId, peerAddr);
            break; // Move to next pending message once forwarded to an eligible peer
          } else {
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
    this.onMessageReceivedListener = null;
    this.onTelemetryUpdatedListener = null;
    this.isRunning = false;
  }
}

export const meshRouter = new MeshRouterManager();
