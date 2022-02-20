import { WebRTCServer } from "@leede/webrtc-server";

const server = new WebRTCServer({
  port: 8000,
  iceServers: ["stun:stun.l.google.com:19302"],
});

server.on("connection", (connection) => {
  console.log("[SERVER] New connection");

  // Send reliable messages
  connection.sendR("Hello from server over TCP");
  connection.sendR(new Float32Array([1.618, 1.414]).buffer);

  // Send unreliable messages
  connection.sendU("Hello from server over UDP");
  connection.sendU(Buffer.from([1, 4, 9, 16, 25, 36]));

  // Handle string messages from connection
  connection.on("message", (message) => {
    console.log("[SERVER] Received message:", message);
  });

  // Handle binary messages from connection
  connection.on("binary", (buffer) => {
    console.log("[SERVER] Received buffer:", buffer);
  });

  // Handle disconnection
  connection.on("close", () => {
    console.log("Connection closed");
  });
});
