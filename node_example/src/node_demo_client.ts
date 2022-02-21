// Polyfills
const ws = require("ws");
const wrtc = require("wrtc");

global.WebSocket = ws.WebSocket;
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

// WebRTCClient can be used in Node.JS after the above global variables are provided
import { WebRTCClient } from "@leede/webrtc-client";

const wrc = new WebRTCClient("ws://localhost:8000");

wrc.on("open", () => {
  console.log("[CLIENT] Connected");

  // Send reliable TCP messages
  wrc.sendR("Hello from client over TCP");
  wrc.sendR(new Float32Array([1.0, 3.14]).buffer);

  // Send unreliable UDP messages
  wrc.sendU("Hello from client over UDP");
  wrc.sendU(Buffer.from([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]));
});

// Handle string messages from server
wrc.on("message", (message) => {
  console.log("[CLIENT] Received message:", message);
});

// Handle binary messages from server
wrc.on("binary", (buffer) => {
  console.log("[CLIENT] Received buffer:", buffer);
});
