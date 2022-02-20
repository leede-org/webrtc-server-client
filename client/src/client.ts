import { EventEmitter } from "events";

export declare interface WebRTCClient {
  on(event: "open", listener: () => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "message", listener: (message: string) => void): this;
  on(event: "binary", listener: (buffer: ArrayBuffer) => void): this;

  off(event: string, listener: (...args: any[]) => void): this;

  /** @internal */
  emit(event: "open"): boolean;
  /** @internal */
  emit(event: "close"): boolean;
  /** @internal */
  emit(event: "error", error: Error): boolean;
  /** @internal */
  emit(event: "message", message: string): boolean;
  /** @internal */
  emit(event: "binary", buffer: ArrayBuffer): boolean;
}

export class WebRTCClient extends EventEmitter {
  public ping: number;

  private ws: WebSocket;
  private pc: RTCPeerConnection;
  private rc: RTCDataChannel;
  private uc: RTCDataChannel;
  private pingSendTime: number;
  private pingTimer: NodeJS.Timer;

  constructor(url: string, pingInterval = 30000) {
    super();
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // console.log("[WebRTCClient] WS connection established");

      this.pingTimer = setInterval(() => this.sendPing(), pingInterval);
      this.sendPing();
    };

    this.ws.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case "config":
          this.createPeerConnection(msg.config);
          break;
        case "offer":
          await this.acceptOffer(msg.sdp);
          break;
        case "candidate":
          await this.pc.addIceCandidate({
            candidate: msg.candidate,
            sdpMid: msg.mid,
          });
          break;
        case "pong":
          this.ping = performance.now() - this.pingSendTime;
          break;
      }
    };

    this.ws.onclose = () => {
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
      }

      // console.log("[WebRTCClient] WS connection lost");
    };

    this.ws.onerror = (err) => {
      //console.log("[WebRTCClient] WebSocket Error: ", err);
      this.emit("error", new Error(`Unable to connect to ${url}`));
    };
  }

  private sendPing() {
    this.pingSendTime = performance.now();
    this.ws.send(JSON.stringify({ type: "ping", time: this.pingSendTime }));
  }

  private createPeerConnection(config: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);

    this.pc.ondatachannel = ({ channel }) => {
      channel.binaryType = "arraybuffer";

      channel.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) {
          return this.emit("binary", data);
        }

        this.emit("message", data);
      };

      switch (channel.label) {
        case "reliable":
          this.rc = channel;
          break;
        case "unreliable":
          this.uc = channel;
          break;
      }

      // Connection is ready when both the reliable and the unreliable channels are open
      if (this.rc && this.uc) {
        this.emit("open");
      }
    };

    this.pc.onicecandidate = (ev) => {
      if (!ev.candidate) {
        return;
      }

      this.ws.send(
        JSON.stringify({
          type: "candidate",
          candidate: ev.candidate.candidate,
          mid: ev.candidate.sdpMid,
        })
      );
    };
  }

  private async acceptOffer(sdp: string) {
    await this.pc.setRemoteDescription({ type: "offer", sdp });

    const originalAnswer = await this.pc.createAnswer();
    const updatedAnswer = new RTCSessionDescription({
      type: "answer",
      sdp: originalAnswer.sdp,
    });

    await this.pc.setLocalDescription(updatedAnswer);

    this.ws.send(JSON.stringify(this.pc.localDescription));
  }

  sendR(message: string | ArrayBuffer) {
    // @ts-ignore
    this.rc.send(message);
  }

  sendU(message: string | ArrayBuffer) {
    // @ts-ignore
    this.uc.send(message);
  }
}
