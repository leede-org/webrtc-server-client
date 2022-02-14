import { WebHybridSocketClient } from "web-hybrid-socket-client";

const client = new WebHybridSocketClient(`ws://localhost:8000`);
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const playersTableBody = document.querySelector("#players tbody");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let players = {};
let myId: number;

// Start sending cursor position once connected
client.onopen = () => {
  canvas.addEventListener("mousemove", (ev) => {
    if (myId) {
      client.unreliable(new Uint16Array([ev.offsetX, ev.offsetY]).buffer);
    }
  });
};

// Handle string messages
client.onmessage = (json) => {
  const message = JSON.parse(json);
  console.log("[MESSAGE]", message);

  switch (message.event) {
    case "players":
      players = message.players;

      if (message.id) {
        myId = message.id;
      }
      break;
    case "new-player":
      players[message.id] = message.player;
      break;
    case "remove-player":
      delete players[message.id];

      if (myId === message.id) {
        myId = undefined;
      }
      break;
  }

  updatePlayersTable();
};

// Handle binary messages
client.onbinary = (buffer) => {
  const id = new Uint32Array(buffer.slice(0, 4));
  const player = players[id + ""];

  if (!player) {
    return;
  }

  player.cursor = new Uint16Array(buffer.slice(4));
};

// Update players table
function updatePlayersTable() {
  let tbody = "";

  for (const id in players) {
    const { name, color } = players[id];
    tbody += `<tr><td>${id}</td><td>${name}</td><td style="color: ${color};">${color}</td></tr>`;
  }

  playersTableBody.innerHTML = tbody;
}

// Render loop
function render() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const id in players) {
    const { color, cursor } = players[id];

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(cursor[0], cursor[1], 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
