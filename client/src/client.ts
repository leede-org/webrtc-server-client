export class WebHybridSocketClient {
  private ws: WebSocket;
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel;
  private connected = false;

  public onopen = () => {};
  public onmessage = (message: string) => {};
  public onbinary = (buffer: ArrayBuffer) => {};
  public onclose = () => {};

  constructor(url: string) {
    console.log(`[WebHybridSocketClient] Connecting to ${url}...`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WebHybridSocketClient] WS connection established");
    };

    this.ws.onmessage = async ({ data }) => {
      const config = JSON.parse(data);
      this.createPeerConnection(config);
    };

    this.ws.onclose = () => {
      console.log("[WebHybridSocketClient] WS connection lost");

      if (this.pc) {
        this.pc.close();
      }

      if (this.connected) {
        this.onclose();
      }
    };

    this.ws.onerror = (err) => {
      console.log("[WebHybridSocketClient] WebSocket Error: ", err);
    };
  }

  createPeerConnection(config: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);

    this.ws.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case "offer":
          await this.acceptOffer(msg.sdp);
          break;
        case "candidate":
          await this.pc.addIceCandidate({
            candidate: msg.candidate,
            sdpMid: msg.mid,
          });
          break;
      }
    };

    this.pc.onsignalingstatechange = () => {
      // console.log(`[WebHybridSocketClient]`, this.pc.signalingState);
    };

    this.pc.ondatachannel = ({ channel }) => {
      this.dc = channel;
      this.dc.binaryType = "arraybuffer";
      this.ws.binaryType = "arraybuffer";
      this.connected = true;

      this.ws.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) {
          return this.onbinary(data);
        }

        this.onmessage(data);
      };

      this.dc.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) {
          return this.onbinary(data);
        }

        this.onmessage(data);
      };

      this.onopen();
    };

    this.pc.onicecandidate = (ev) => {
      // console.log("[WebHybridSocketClient]", ev.candidate);

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

  reliable(message: string | ArrayBuffer) {
    if (!this.connected) {
      return;
    }

    this.ws.send(message);
  }

  unreliable(message: string | ArrayBuffer) {
    if (!this.connected) {
      return;
    }

    // @ts-ignore
    this.dc.send(message);
  }
}
