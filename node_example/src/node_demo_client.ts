// Polyfills
const ws = require("ws");
const wrtc = require("wrtc");

global.WebSocket = ws.WebSocket;
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

// WebRTCClient can be used in Node.JS after the above global variables are provided
import { WebRTCClient } from "@leede/webrtc-client";

const client = new WebRTCClient("ws://localhost:8000");

client.onopen = () => {
  console.log("[CLIENT] Connected");

  // Send reliable TCP messages
  client.sendR("Hello from client over TCP");
  client.sendR(new Float32Array([1.0, 3.14]).buffer);

  // Send unreliable UDP messages
  client.sendU("Hello from client over UDP");
  client.sendU(Buffer.from([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]));
};

// Handle string messages from server
client.onmessage = (message) => {
  console.log("[CLIENT] Received message:", message);
};

// Handle binary messages from server
client.onbinary = (buffer) => {
  console.log("[CLIENT] Received buffer:", buffer);
};
