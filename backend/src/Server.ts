import express from "express";
import { Express } from "express-serve-static-core";
import http from "http";
import path from "path";
import sockjs, { Connection } from "sockjs";

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

type Message = {
  who: string;
  message: string;
};

function add_backend(server: http.Server) {
  const connected_clients = new Set<Connection>();
  const sockjs_server = sockjs.createServer();
  sockjs_server.on("connection", (client) => {
    connected_clients.add(client);
    client.on("data", (msg) => {
      const verified_msg_str = ((): string | null => {
        try {
          const data = JSON.parse(msg);
          if (typeof data != "object") {
            return null;
          }
          if (typeof data.who != "string") {
            return null;
          }
          if (typeof data.message != "string") {
            return null;
          }
          const verified_msg: Message = {
            who: data.who,
            message: data.message,
          };

          return JSON.stringify(verified_msg);
        } catch {
          return null;
        }
      })();
      if (verified_msg_str != null) {
        connected_clients.forEach((connection) =>
          connection.write(verified_msg_str)
        );
      }
    });
    client.on("close", () => connected_clients.delete(client));
  });
  sockjs_server.installHandlers(server, { prefix: "/api" });
}

export function start_server(port: number): http.Server {
  const app = express();
  const server = http.createServer(app);
  add_frontend(app);
  add_backend(server);

  server.listen(port, () => {
    return console.log(`server is listening on ${port}`);
  });
  return server;
}
