import * as http from "http";
import * as express from "express";
import * as path from "path";
import { WebRTCServer } from "@leede/webrtc-server";

// HTTP server
const app = express();
const server = new http.Server(app);

// Serve static assets
if (process.env.NODE_ENV !== "development") {
  const staticPath = path.resolve(__dirname, "..", "client");
  app.use(express.static(staticPath));
}

// Simple broadcasting server
const wrs = new WebRTCServer({
  server,
  iceServers: ["stun:stun.l.google.com:19302"],
  portRangeBegin: parseInt(process.env.PORT_RANGE_BEGIN || "0"),
  portRangeEnd: parseInt(process.env.PORT_RANGE_END || "65535"),
});

let nextPlayerId = 1;
const players = new Map<number, { name: string; color: string }>();

wrs.on("connection", (connection) => {
  console.log(`[SERVER] New connection`);

  // Create a new player for this connection
  const id = nextPlayerId++;
  const player = {
    name: `Player${id}`,
    color: (
      "#" +
      Math.floor((Math.random() * 16777215) / 2).toString(16) +
      "000000"
    ).substring(0, 7),
    cursor: new Uint16Array([0, 0]),
  };

  players.set(id, player);

  // Reliably send all players and connection's player id to this connection
  connection.sendR(
    JSON.stringify({
      event: "players",
      players: Object.fromEntries(players),
      id,
    })
  );

  // Reliably broadcast new player to all other connections
  connection.broadcastR(JSON.stringify({ event: "new-player", id, player }));

  // Handle string messages from connection
  connection.on("message", (json) => {
    const message = JSON.parse(json);
  });

  // Allocate a buffer that is broadcasted to everyone every time the connection sends an updated cursor position
  // The buffer contains 4 bytes for the player id and 2*2 bytes for UInt16 cursor x and y coordinates
  const broadcastBuffer = Buffer.alloc(4 + 2 * 2);

  // The first 4 bytes of the buffer are allocated for the player id
  broadcastBuffer.writeUInt32LE(id, 0);

  // Handle binary messages from connection
  connection.on("binary", (buffer) => {
    player.cursor = new Uint16Array(buffer);

    // The last 4 bytes contain the x and y cursor positions
    broadcastBuffer.writeUInt16LE(player.cursor[0], 4);
    broadcastBuffer.writeUInt16LE(player.cursor[1], 6);

    // The new cursor position is broadcasted to all connections, including the sender itself
    wrs.broadcastU(broadcastBuffer.buffer);
  });

  // Remove player on disconnect
  connection.on("close", () => {
    players.delete(id);
    wrs.broadcastR(JSON.stringify({ event: "remove-player", id }));
  });
});

// Bind to configured port
const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`[SERVER] Running on port ${port}`);
});
