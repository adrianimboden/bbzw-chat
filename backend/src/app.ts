import express from "express";
import { Express } from "express-serve-static-core";
import http from "http";
import path from "path";
import sockjs from "sockjs";

function add_frontend(app: Express) {
  const path_to_frontend = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "build"
  );
  app.use(express.static(path.join(path_to_frontend)));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(path_to_frontend, "index.html"));
  });
}

const app = express();
add_frontend(app);

//sockjs
const sockjs_server = sockjs.createServer();
sockjs_server.on("connection", (conn) => {
  conn.on("data", (msg) => conn.write(msg));
});

const server = http.createServer(app);
sockjs_server.installHandlers(server, { prefix: "/api" });

const port = process.env.PORT || 3001;
server.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
