import "./server";

/*
// Client polyfills
import { WebHybridSocketClient } from "web-hybrid-socket-client";
import { WebSocket } from "ws";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from "wrtc";

// @ts-ignore
global.WebSocket = WebSocket;
// @ts-ignore
global.RTCPeerConnection = RTCPeerConnection;
// @ts-ignore
global.RTCSessionDescription = RTCSessionDescription;
// @ts-ignore
global.RTCIceCandidate = RTCIceCandidate;

// Client 1
const client1 = new WebHybridSocketClient();

client1.onopen = () => {
  console.log(`[CLIENT1] connected`);

  client1.reliable("reliable hello from CLIENT1");
  client1.reliable(new Float32Array([1, 2]).buffer);

  client1.unreliable("unreliable hello from CLIENT1");
  client1.unreliable(new Float32Array([1, 2]).buffer);
};

client1.onmessage = (message) => {
  console.log(`[CLIENT1] received`, message);
};

client1.onbinary = async (buffer) => {
  console.log(
    `[CLIENT1] received`,
    buffer,
    new Float32Array(buffer),
    Buffer.from(buffer)
  );
};

// Client 2
const client2 = new WebHybridSocketClient();

client2.onopen = () => {
  console.log(`[CLIENT2] connected`);

  client2.reliable("reliable hello from CLIENT2");
  client2.reliable(new Float32Array([1, 2]).buffer);

  client2.unreliable("unreliable hello from CLIENT2");
  client2.unreliable(new Float32Array([1, 2]).buffer);
};

client2.onmessage = (message) => {
  console.log(`[CLIENT2] received`, message);
};

client2.onbinary = async (buffer) => {
  console.log(
    `[CLIENT2] received`,
    buffer,
    new Float32Array(buffer),
    Buffer.from(buffer)
  );
};
*/
