import { Server } from "http";
import SockJS from "sockjs-client";
import { start_server } from "./Server";
import waitForExpect from "wait-for-expect";

const port = 9999;
const server_address = `http://127.0.0.1:${port}/api`;

let test_server: Server | null = null;
let connections: WebSocket[] = [];

const connect = async () => {
  const sock = new SockJS(server_address);
  connections.push(sock);

  let is_open = false;
  sock.onopen = () => (is_open = true);
  await waitForExpect(() => expect(is_open).toBe(true));
  return sock;
};

beforeEach(async () => {
  test_server = start_server(port);
});
afterEach(() => {
  connections.forEach((conn) => conn.close());
  connections = [];
  if (test_server != null) {
    test_server.close();
  }
});

describe("message distribution", () => {
  it("receives my own message", async () => {
    let last_received_message = "";
    const conn1 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn1.send("msg1");
    await waitForExpect(() => expect(last_received_message).toEqual("msg1"));

    conn1.close();
  });

  it("receives foreign message", async () => {
    let last_received_message = "";
    const conn1 = await connect();
    const conn2 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn2.send("msg1");
    await waitForExpect(() => expect(last_received_message).toEqual("msg1"));

    conn1.close();
    conn2.close();
  });
});
