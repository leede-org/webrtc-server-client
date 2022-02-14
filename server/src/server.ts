import { IceServer, PeerConnection } from "node-datachannel";
import { WebSocketServer } from "ws";
import * as http from "http";
import { WebHybridSocketConnection } from "./connection";

export interface WebHybridSocketServerOptions {
  port?: number;
  server?: http.Server;
  iceServers: (string | IceServer)[];
  portRangeBegin?: number;
  portRangeEnd?: number;
}

export class WebHybridSocketServer {
  public onconnection = (connection: WebHybridSocketConnection) => {};

  private nextConnectionId = 1;
  private connections = new Map<number, WebHybridSocketConnection>();

  private getClientRtcConfiguration() {
    const clientRtcConfiguration: RTCConfiguration = {
      iceServers: [],
      iceTransportPolicy: "all",
    };

    for (const iceServer of this.options.iceServers) {
      if (typeof iceServer === "string") {
        clientRtcConfiguration.iceServers.push({
          urls: iceServer,
        });
      } else {
      }
    }

    return clientRtcConfiguration;
  }

  constructor(private options: WebHybridSocketServerOptions) {
    const wss = new WebSocketServer({
      port: options.port,
      server: options.server,
    });

    const clientRtcConfigurationJSON = JSON.stringify(
      this.getClientRtcConfiguration()
    );

    wss.on("connection", (ws) => {
      const id = this.nextConnectionId++;
      const pc = new PeerConnection(id.toString(), {
        iceServers: options.iceServers,
        iceTransportPolicy: "all",
        portRangeBegin: options.portRangeBegin,
        portRangeEnd: options.portRangeEnd,
      });

      pc.onLocalCandidate((candidate, mid) => {
        // console.log(`[SERVER] ${candidate}`);
        ws.send(JSON.stringify({ type: "candidate", candidate, mid }));
      });

      pc.onLocalDescription((sdp, type) => {
        ws.send(JSON.stringify({ type, sdp }));
      });

      const dc = pc.createDataChannel("data");

      dc.onOpen(() => {
        ws.off("message", signalingListener);

        const connection = new WebHybridSocketConnection(this, ws, dc);
        this.connections.set(id, connection);
        this.onconnection(connection);
      });

      pc.onSignalingStateChange((state) => console.log("[SERVER]", state));

      const signalingListener = (buffer: Buffer) => {
        const message = JSON.parse(buffer.toString());
        // console.log("[SERVER]", message);

        switch (message.type) {
          case "answer":
            pc.setRemoteDescription(message.sdp, message.type);
            break;
          case "candidate":
            pc.addRemoteCandidate(message.candidate, message.mid);
            break;
        }
      };

      ws.on("message", signalingListener);

      ws.on("close", () => {
        console.log(`${id} disconected`);
        this.connections.get(id)?.onclose();
        this.connections.delete(id);
      });

      ws.send(clientRtcConfigurationJSON);
    });
  }

  getConnections() {
    return this.connections.values();
  }

  broadcastReliable(message: string | ArrayBuffer) {
    const connections = this.getConnections();

    for (const connection of connections) {
      connection.reliable(message);
    }
  }

  broadcastUnreliable(message: string | ArrayBuffer) {
    const connections = this.getConnections();

    for (const connection of connections) {
      connection.unreliable(message);
    }
  }

  broadcast(message: string | ArrayBuffer, reliable: boolean) {
    if (reliable) {
      return this.broadcastReliable(message);
    }

    return this.broadcastUnreliable(message);
  }
}
