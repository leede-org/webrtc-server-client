# Web Hybrid Socket

## Install

```sh
npm install @leede/web-hybrid-socket-server @leede/web-hybrid-socket-client
```

## Basic server-side usage

```ts
import { WebHybridSocketServer } from "@leede/web-hybrid-socket-server";

const whss = new WebHybridSocketServer({
  port: 8000,
  iceServers: ["stun:stun.l.google.com:19302"],
});

whss.onconnection = (connection) => {
  console.log("New connection");

  // Send a reliable TCP string message using WebSocket
  connection.reliable("Hello over WebSocket");

  // Send an unreliable UDP string message using WebRTC
  connection.unreliable("Hello over WebRTC");

  // Handle string messages from connection
  connection.onmessage = (message) => {
    console.log(`Received: ${message}`);
  };

  // Handle binary messages from connection
  connection.onbinary = (buffer) => {
    console.log(`Received buffer:`, buffer);
  };

  // Handle disconnection
  connection.onclose = () => {
    console.log("Connection closed");
  };
};
```

## Basic client-side usage

```ts
import { WebHybridSocketClient } from "@leede/web-hybrid-socket-client";

const whsc = new WebHybridSocketClient("ws://localhost:8000");

whsc.onopen = () => {
  console.log("Connection established");

  // Send a reliable TCP string message using WebSocket
  whsc.reliable("Hello over WebSocket");

  // Send an unreliable UDP string message using WebRTC
  whsc.unreliable("Hello over WebRTC");
};

// Handle string messages from server
whsc.onmessage = (message) => {
  console.log(`Received message: ${message}`);
};

// Handle binary messages from server
whsc.onbinary = (buffer) => {
  console.log(`Received buffer:`, buffer);
};
```
