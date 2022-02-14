import { DataChannel } from "node-datachannel";
import { WebSocket } from "ws";
import { WebHybridSocketServer } from "./server";

export class WebHybridSocketConnection {
  public onmessage = (message: string, reliable: boolean) => {};
  public onbinary = (arrayBuffer: ArrayBuffer, reliable: boolean) => {};
  public onclose = () => {};

  constructor(
    private server: WebHybridSocketServer,
    private ws: WebSocket,
    private dc: DataChannel
  ) {
    ws.binaryType = "arraybuffer";

    ws.on("message", (message) => {
      if (message instanceof ArrayBuffer) {
        return this.onbinary(message, true);
      }

      return this.onmessage(message.toString(), true);
    });

    dc.onMessage((msg: string | Buffer) => {
      if (msg instanceof Buffer) {
        return this.onbinary(msg.buffer, false);
      }

      this.onmessage(msg, false);
    });
  }

  reliable(message: string | ArrayBuffer) {
    this.ws.send(message);
    return true;
  }

  unreliable(message: string | ArrayBuffer) {
    /*
    if (message instanceof Buffer) {
      return this.dc.sendMessageBinary(message);
    }
    */

    if (message instanceof ArrayBuffer) {
      return this.dc.sendMessageBinary(Buffer.from(message));
    }

    return this.dc.sendMessage(message);
  }

  send(message: string | ArrayBuffer, reliable: boolean) {
    if (reliable) {
      return this.reliable(message);
    }

    return this.unreliable(message);
  }

  broadcastReliable(message: string | ArrayBuffer) {
    const connections = this.server.getConnections();

    for (const connection of connections) {
      if (this !== connection) {
        connection.reliable(message);
      }
    }
  }

  broadcastUnreliable(message: string | ArrayBuffer) {
    const connections = this.server.getConnections();

    for (const connection of connections) {
      if (this !== connection) {
        connection.unreliable(message);
      }
    }
  }

  broadcast(message: string | ArrayBuffer, reliable: boolean) {
    if (reliable) {
      return this.broadcastReliable(message);
    }

    return this.broadcastUnreliable(message);
  }
}
