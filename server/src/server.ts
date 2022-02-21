import { IceServer, PeerConnection } from "node-datachannel";
import { WebSocketServer } from "ws";
import * as http from "http";
import { EventEmitter } from "events";
import { WebRTCConnection } from "./connection";

export interface WebRTCServerOptions {
  /**
   * The {@link WebRTCServer} uses a WebSocket signalling server to establish WebRTC peer connections. This is the port that the WebSocket server will be bound to.
   */
  port?: number;
  /**
   * Instead of providing a port, you can also add the signalling server to an instance of the `http.Server` class. This allows you to serve HTTP requests on the
   * same server where {@link WebRTCServer} is running.
   */
  server?: http.Server;
  /**
   * The list of ICE servers. There are lists of publicly usable ICE servers available but you may want to run your own for production.
   * This can be an empty array when running the server and client locally in development. You may also want to look into the `freeice`
   * package on npm.
   */
  iceServers: (string | IceServer)[];
  /**
   * The server uses a separate UDP port for each connection. By default it chooses a port between 0-65535 but this can be overriden
   * using the `portRangeBegin` and `portRangeEnd` parameters.
   */
  portRangeBegin?: number;
  /**
   * The server uses a separate UDP port for each connection. By default it chooses a port between 0-65535 but this can be overriden
   * using the `portRangeBegin` and `portRangeEnd` parameters.
   */
  portRangeEnd?: number;
}

export declare interface WebRTCServer {
  /**
   * Add an event listener for new connections to the server. The listener is provided an instance of the {@link WebRTCConnection} class
   * on which additional event listeners can be bound for incoming messages and the disconnection event.
   *
   * ```ts
   * const wrs = new WebRTCServer({ port: 8000, iceServers: ["stun:stun.l.google.com:19302"] });
   *
   * wrs.on("connection", connection => {
   *   connection.on("message", console.log(`Received ${message} from ${connection.id}`));
   * });
   * ```
   *
   * @param event
   * @param listener
   */
  on(
    event: "connection",
    listener: (connection: WebRTCConnection) => void
  ): this;

  /**
   * Remove an event listener.
   * @param event
   * @param listener
   */
  off(event: string, listener: (...args: any[]) => void): this;

  /** @internal */
  emit(event: "connection", connection: WebRTCConnection): boolean;
}

export class WebRTCServer extends EventEmitter {
  private nextConnectionId = 1;
  private connections = new Map<string, WebRTCConnection>();

  /**
   * The server can be started by either binding to a specific TCP port or by providing an instance of the `http.Server` class. In addition, you also need to provide
   * a list of ICE servers. There are lists of publicly usable ICE servers available but you may want to run your own for production. See the {@link WebRTCServerOptions}
   * documentation for more options.
   *
   * Standalone example:
   * ```ts
   * const wrs = new WebRTCServer({ port: 8000, iceServers: ["stun:stun.l.google.com:19302"] });
   *
   * wrs.on("connection", connection => {
   *   // ...
   * });
   * ```
   *
   * Using with `http.Server` example:
   * ```ts
   * import * as http from "http";
   *
   * const httpServer = new http.Server();
   * const wrs = new WebRTCServer({ server: httpServer, iceServers: ["stun:stun.l.google.com:19302"] });
   *
   * wrs.on("connection", connection => {
   *   // ...
   * });
   *
   * httpServer.listen(8000);
   * ```
   *
   * Using an instance of the `http.Server` class also allows you to bind e.g. an `express` application on the same server:
   * ```ts
   * import * as http from "http";
   * import * as express from "express";
   *
   * const app = express();
   * const httpServer = new http.Server(app);
   *
   * app.get("/", (req, res) => res.send("Hello, world!"));
   *
   * const wrs = new WebRTCServer({ server: httpServer, iceServers: ["stun:stun.l.google.com:19302"] });
   *
   * wrs.on("connection", connection => {
   *   // ...
   * });
   *
   * httpServer.listen(8000);
   * ```
   */
  constructor(private options: WebRTCServerOptions) {
    super();

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
            this.connections.get(id)?.emit("close");
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
            this.emit("connection", connection);
          }
        });
      }
    });
  }

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

  /**
   * Send a message to all connections on the reliable data channel.
   * @param message
   */
  broadcastR(message: string | ArrayBuffer) {
    const connections = this.getConnections();

    for (const connection of connections) {
      connection.sendR(message);
    }
  }

  /**
   * Send a message to all connections on the unreliable data channel.
   * @param message
   */
  broadcastU(message: string | ArrayBuffer) {
    const connections = this.getConnections();

    for (const connection of connections) {
      connection.sendU(message);
    }
  }

  /**
   * Get the iterator for all connections to the server.
   *
   * ```ts
   * const connections = wrs.getConnections();
   *
   * for (const connection of connections) {
   *   connection.sendR("hello");
   * }
   * ```
   *
   * @returns Iterator for all connections.
   */
  getConnections() {
    return this.connections.values();
  }
}
