import { IceServer, PeerConnection } from "node-datachannel";
import { WebSocketServer } from "ws";
import * as http from "http";
import { WebRTCConnection } from "./connection";

export interface WebRTCServerOptions {
  port?: number;
  server?: http.Server;
  iceServers: (string | IceServer)[];
  portRangeBegin?: number;
  portRangeEnd?: number;
}

export class WebRTCServer {
  public onconnection = (connection: WebRTCConnection) => {};

  private nextConnectionId = 1;
  private connections = new Map<string, WebRTCConnection>();

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

  constructor(private options: WebRTCServerOptions) {
    const wss = new WebSocketServer({
      port: options.port,
      server: options.server,
    });

    const clientRtcConfigurationJSON = JSON.stringify({
      type: "config",
      config: this.getClientRtcConfiguration(),
    });

    wss.on("connection", (ws) => {
      // Generate unique ID
      const id = (this.nextConnectionId++).toString();

      // Create WebRTC peer connection
      const pc = new PeerConnection(id, {
        iceServers: options.iceServers,
        iceTransportPolicy: "all",
        portRangeBegin: options.portRangeBegin,
        portRangeEnd: options.portRangeEnd,
      });

      pc.onStateChange((state) => {
        switch (state) {
          case "disconnected":
            this.connections.get(id)?.onclose();
            this.connections.delete(id);
            break;
        }
      });

      // Handle signalling
      ws.on("message", (buffer: Buffer) => {
        const message = JSON.parse(buffer.toString());

        switch (message.type) {
          case "ping":
            ws.send('{ "type": "pong" }');
            break;
          case "answer":
            pc.setRemoteDescription(message.sdp, message.type);
            break;
          case "candidate":
            pc.addRemoteCandidate(message.candidate, message.mid);
            break;
        }
      });

      // Don't send candidates until the description has been sent
      let descriptionSent = false;
      const candidatesQueue = [];

      pc.onLocalCandidate((candidate, mid) => {
        if (descriptionSent) {
          ws.send(JSON.stringify({ type: "candidate", candidate, mid }));
        } else {
          candidatesQueue.push(
            JSON.stringify({ type: "candidate", candidate, mid })
          );
        }
      });

      pc.onLocalDescription((sdp, type) => {
        ws.send(JSON.stringify({ type, sdp }));
        descriptionSent = true;

        for (const candidateJson of candidatesQueue) {
          ws.send(candidateJson);
        }
      });

      ws.send(clientRtcConfigurationJSON);

      // Set up a reliable and an unreliable data channel
      let readyState = 0;

      const reliableChannel = pc.createDataChannel("reliable", {
        ordered: true,
      });
      const unreliableChannel = pc.createDataChannel("unreliable", {
        ordered: false,
        maxPacketLifeTime: undefined,
        maxRetransmits: 0,
      });

      for (const channel of [reliableChannel, unreliableChannel]) {
        channel.onOpen(() => {
          // Create connection instance when both channels are open
          if (++readyState === 2) {
            const connection = new WebRTCConnection(
              this,
              id,
              reliableChannel,
              unreliableChannel
            );

            this.connections.set(id, connection);
            this.onconnection(connection);
          }
        });
      }
    });
  }

  getConnections() {
    return this.connections.values();
  }

  broadcastR(message: string | ArrayBuffer) {
    const connections = this.getConnections();

    for (const connection of connections) {
      connection.sendR(message);
    }
  }

  broadcastU(message: string | ArrayBuffer) {
    const connections = this.getConnections();

    for (const connection of connections) {
      connection.sendU(message);
    }
  }
}
