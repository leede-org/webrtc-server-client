import { WebHybridSocketClient } from "@leede/web-hybrid-socket-client";

const whsc = new WebHybridSocketClient("ws://localhost:8000");

whsc.onopen = () => {
  console.log("Connection established");

  // Send reliable TCP messages using WebSocket
  whsc.reliable("Hello from client over WebSocket");
  whsc.reliable(new Float32Array([1.0, 3.14]).buffer);

  // Send unreliable UDP messages using WebRTC
  whsc.unreliable("Hello from client over WebRTC");
  whsc.reliable(Buffer.from([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]));
};

// Handle string messages from server
whsc.onmessage = (message) => {
  console.log(`Received message: ${message}`);
};

// Handle binary messages from server
whsc.onbinary = (buffer) => {
  console.log(`Received buffer:`, buffer);
};
