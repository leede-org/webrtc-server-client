import * as http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import { WebRTCServer } from "../server";
import { WebRTCClient } from "../client";

// Polyfills
const ws = require("ws");
const wrtc = require("wrtc");

global.WebSocket = ws.WebSocket;
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

// Establish server-client connections
function establishConnections(
  nClients: number = 1,
  cb: (
    wrs: WebRTCServer,
    wrc: WebRTCClient[],
    close: (closeCb: () => void) => void
  ) => void
) {
  const server = new http.Server();

  server.listen(() => {
    const address = server.address() as AddressInfo;
    const wrs = new WebRTCServer({ server, iceServers: [] });
    const wrc = [];

    for (let i = 0; i < nClients; ++i) {
      const wrcI = new WebRTCClient(`ws://localhost:${address.port}`);

      wrcI.on("open", () => {
        wrc.push(wrcI);
      });
    }

    let connections = 0;

    wrs.on("connection", () => {
      if (++connections === nClients) {
        cb(wrs, wrc, (closeCb) => {
          for (const wrcI of wrc) {
            wrcI.close();
          }

          wrs.close();
          server.close(() => closeCb());
        });
      }
    });
  });
}

// Test reliable messaging
describe("Reliable messaging", () => {
  it("WebRTCClient.sendR(string)", (done) => {
    establishConnections(1, (wrs, wrc, close) => {
      wrs.getConnection(wrc[0].id).on("message", (message) =>
        close(() => {
          expect(message).to.equal("hello");
          done();
        })
      );

      wrc[0].sendR("hello");
    });
  });

  it("WebRTCConnection.sendR(string)", (done) => {
    establishConnections(1, (wrs, wrc, close) => {
      wrc[0].on("message", (message) =>
        close(() => {
          expect(message).to.equal("hello");
          done();
        })
      );

      wrs.getConnection(wrc[0].id).sendR("hello");
    });
  });

  it("WebRTCServer.broadcastR(string)", (done) => {
    establishConnections(5, (wrs, wrc, close) => {
      let received = 0;

      for (let i = 0; i < wrc.length; ++i) {
        wrc[i].on("message", (message) => {
          expect(message).to.equal("hello");

          if (++received === 5) {
            close(done);
          }
        });
      }

      wrs.broadcastR("hello");
    });
  });

  it("WebRTCConnection.broadcastR(string)", (done) => {
    establishConnections(5, (wrs, wrc, close) => {
      let received = 0;

      for (let i = 1; i < wrc.length; ++i) {
        wrc[i].on("message", (message) => {
          expect(message).to.equal("hello");

          if (++received === 4) {
            close(done);
          }
        });
      }

      wrs.getConnection(wrc[0].id).broadcastR("hello");
    });
  });
});

// Test unreliable messaging
describe("Unreliable messaging", () => {
  it("WebRTCClient.sendU(string)", (done) => {
    establishConnections(1, (wrs, wrc, close) => {
      wrs.getConnection(wrc[0].id).on("message", (message) =>
        close(() => {
          expect(message).to.equal("hello");
          done();
        })
      );

      wrc[0].sendU("hello");
    });
  });

  it("WebRTCConnection.sendU(string)", (done) => {
    establishConnections(1, (wrs, wrc, close) => {
      wrc[0].on("message", (message) =>
        close(() => {
          expect(message).to.equal("hello");
          done();
        })
      );

      wrs.getConnection(wrc[0].id).sendU("hello");
    });
  });

  it("WebRTCServer.broadcastU(string)", (done) => {
    establishConnections(5, (wrs, wrc, close) => {
      let received = 0;

      for (let i = 0; i < wrc.length; ++i) {
        wrc[i].on("message", (message) => {
          expect(message).to.equal("hello");

          if (++received === 5) {
            close(done);
          }
        });
      }

      wrs.broadcastU("hello");
    });
  });

  it("WebRTCConnection.broadcastU(string)", (done) => {
    establishConnections(5, (wrs, wrc, close) => {
      let received = 0;

      for (let i = 1; i < wrc.length; ++i) {
        wrc[i].on("message", (message) => {
          expect(message).to.equal("hello");

          if (++received === 4) {
            close(done);
          }
        });
      }

      wrs.getConnection(wrc[0].id).broadcastU("hello");
    });
  });
});

// Test binary messaging
describe("Binary messaging", () => {
  it("WebRTCClient.sendR(Uint32Array)", (done) => {
    establishConnections(1, (wrs, wrc, close) => {
      wrs.getConnection(wrc[0].id).on("binary", (message) =>
        close(() => {
          const typedArray = new Uint32Array(message);
          expect(typedArray[0]).to.equal(314);
          expect(typedArray[1]).to.equal(1618);
          done();
        })
      );

      wrc[0].sendR(new Uint32Array([314, 1618]).buffer);
    });
  });

  it("WebRTCClient.sendR(Buffer)", (done) => {
    establishConnections(1, (wrs, wrc, close) => {
      wrs.getConnection(wrc[0].id).on("binary", (message) =>
        close(() => {
          const buffer = Buffer.from(message);

          expect(buffer[0]).to.equal(1);
          expect(buffer[1]).to.equal(2);
          expect(buffer[2]).to.equal(3);
          expect(buffer[3]).to.equal(4);
          done();
        })
      );

      wrc[0].sendR(Buffer.from([1, 2, 3, 4]));
    });
  });
});
