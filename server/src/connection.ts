import { DataChannel } from "node-datachannel";
import { EventEmitter } from "events";
import { WebRTCServer } from "./server";

export declare interface WebRTCConnection {
  on(event: "close", listener: () => void): this;
  on(event: "message", listener: (message: string) => void): this;
  on(event: "binary", listener: (buffer: ArrayBuffer) => void): this;

  off(event: string, listener: (...args: any[]) => void): this;

  /** @internal */
  emit(event: "close"): boolean;
  /** @internal */
  emit(event: "message", message: string): boolean;
  /** @internal */
  emit(event: "binary", buffer: ArrayBuffer): boolean;
}

export class WebRTCConnection extends EventEmitter {
  /** @internal */
  constructor(
    private server: WebRTCServer,
    public id: string,
    private rc: DataChannel,
    private uc: DataChannel
  ) {
    super();

    for (const channel of [rc, uc]) {
      channel.onMessage((msg) => {
        if (msg instanceof Buffer) {
          return this.emit("binary", msg.buffer);
        }

        this.emit("message", msg);
      });
    }
  }

  private send(channel: DataChannel, message: string | ArrayBuffer) {
    try {
      if (message instanceof Buffer) {
        return channel.sendMessageBinary(message);
      }

      if (message instanceof ArrayBuffer) {
        return channel.sendMessageBinary(Buffer.from(message));
      }

      return channel.sendMessage(message);
    } catch (_) {
      // sending message fails if channel is not open
      return false;
    }
  }

  /**
   * Send a message to the connection on the reliable data channel.
   * @param message
   * @returns
   */
  sendR(message: string | ArrayBuffer) {
    return this.send(this.rc, message);
  }

  /**
   * Send a message to the connection on the unreliable data channel.
   * @param message
   * @returns
   */
  sendU(message: string | ArrayBuffer) {
    return this.send(this.uc, message);
  }

  /**
   * Send a message to all other connections on the reliable data channel.
   * @param message
   */
  broadcastR(message: string | ArrayBuffer) {
    const connections = this.server.getConnections();

    for (const connection of connections) {
      if (this.id !== connection.id) {
        connection.sendR(message);
      }
    }
  }

  /**
   * Send a message to all other connections on the unreliable data channel.
   * @param message
   */
  broadcastU(message: string | ArrayBuffer) {
    const connections = this.server.getConnections();

    for (const connection of connections) {
      if (this.id !== connection.id) {
        connection.sendU(message);
      }
    }
  }
}
