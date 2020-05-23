const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

app.get("/room/:room", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

const socket = require("./socket");
io.on("connection", socket);

const channels = require("./channels");
app.get("/channel/:publicKey", async (req, res) => {
  const state = await channels.readPublic(req.params.publicKey);
  res.json(state);
});

app.get("/code/:shortCode", async (req, res) => {
  const state = await channels.readShort(req.params.shortCode);
  res.json(state);
});

http.listen(4000, () => {
  console.log("server starting...");
});
