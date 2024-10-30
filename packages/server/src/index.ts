import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

const app = express();
const wss = new WebSocketServer({ noServer: true });

const pillarPositions: [number, number][] = [];
const enemyPositions: [number, number][] = [];

for (let i = 0; i < 1000; i++) {
  pillarPositions.push([
    Math.floor(-250 + 500 * Math.random()),
    Math.floor(-250 + 500 * Math.random()),
  ]);
}

for (let i = 0; i < 10; i++) {
  enemyPositions.push([
    Math.floor(-250 + 500 * Math.random()),
    Math.floor(-250 + 500 * Math.random()),
  ]);
}

app.get("/api/map", (_, res) => {
  res.json({
    pillarPositions,
    enemyPositions,
  });
});

const positions: Record<string, any> = {};

wss.on("connection", (ws) => {
  const id = randomUUID();

  ws.send(JSON.stringify({ id }));

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data.toString());
    positions[id] = data;
  });

  ws.on("close", () => {
    delete positions[id];
  });
});

setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }

    client.send(JSON.stringify({ positions }));
  }
}, 100);

const server = app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
