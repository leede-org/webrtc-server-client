# Web Hybrid Socket Client

## Install

```sh
npm install @leede/web-hybrid-socket-client
```

## Basic usage

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
