import { DataChannel } from "node-datachannel";
import { WebRTCServer } from "./server";

export class WebRTCConnection {
  public onmessage = (message: string) => {};
  public onbinary = (arrayBuffer: ArrayBuffer) => {};
  public onclose = () => {};

  constructor(
    private server: WebRTCServer,
    public id: string,
    private rc: DataChannel,
    private uc: DataChannel
  ) {
    for (const channel of [rc, uc]) {
      channel.onMessage((msg) => {
        if (msg instanceof Buffer) {
          return this.onbinary(msg.buffer);
        }

        this.onmessage(msg);
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

  sendR(message: string | ArrayBuffer) {
    return this.send(this.rc, message);
  }

  sendU(message: string | ArrayBuffer) {
    return this.send(this.uc, message);
  }

  private broadcast(channel: DataChannel, message: string | ArrayBuffer) {
    const connections = this.server.getConnections();

    for (const connection of connections) {
      if (this !== connection) {
        connection.send(channel, message);
      }
    }
  }

  broadcastR(message: string | ArrayBuffer) {
    return this.broadcast(this.rc, message);
  }

  broadcastU(message: string | ArrayBuffer) {
    return this.broadcast(this.rc, message);
  }
}
