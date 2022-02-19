export class WebRTCClient {
  private ws: WebSocket;
  private pc: RTCPeerConnection;
  private rc: RTCDataChannel;
  private uc: RTCDataChannel;
  private pingSendTime: number;
  private pingTimer: NodeJS.Timer;

  public ping: number;

  public onopen = () => {};
  public onmessage = (message: string) => {};
  public onbinary = (buffer: ArrayBuffer) => {};
  public onclose = () => {};

  constructor(url: string, pingInterval = 30000) {
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

      console.log("[WebRTCClient] WS connection lost");
    };

    this.ws.onerror = (err) => {
      console.log("[WebRTCClient] WebSocket Error: ", err);
    };
  }

  private sendPing() {
    this.pingSendTime = performance.now();
    this.ws.send(JSON.stringify({ type: "ping", time: this.pingSendTime }));
  }

  createPeerConnection(config: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);

    /*
    this.pc.onsignalingstatechange = () => {
      if (this.pc.signalingState === "stable") {
        this.onopen();
      }
    };
    */

    this.pc.ondatachannel = ({ channel }) => {
      channel.binaryType = "arraybuffer";

      channel.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) {
          return this.onbinary(data);
        }

        this.onmessage(data);
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
        this.onopen();
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

  async acceptOffer(sdp: string) {
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
