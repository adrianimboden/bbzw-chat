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
    let last_received_message = "{}";
    const conn1 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn1.send(JSON.stringify({ who: "user1", message: "msg1" }));
    await waitForExpect(() =>
      expect(JSON.parse(last_received_message)).toEqual({
        who: "user1",
        message: "msg1",
      })
    );

    conn1.close();
  });

  it("receives foreign message", async () => {
    let last_received_message = "{}";
    const conn1 = await connect();
    const conn2 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn1.send(JSON.stringify({ who: "user2", message: "msg2" }));
    await waitForExpect(() =>
      expect(JSON.parse(last_received_message)).toEqual({
        who: "user2",
        message: "msg2",
      })
    );

    conn1.close();
    conn2.close();
  });

  it("invalid json gets rejected", async () => {
    let last_received_message = "";
    let timeout_happened = false;
    const conn1 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn1.send("invalid");
    setTimeout(() => {
      timeout_happened = true;
    }, 100);
    await waitForExpect(() => expect(timeout_happened).toEqual(true));
    await waitForExpect(() => expect(last_received_message).toEqual(""));

    conn1.close();
  });

  it("missing data gets rejected", async () => {
    let last_received_message = "";
    let timeout_happened = false;
    const conn1 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn1.send(JSON.stringify({ message: "msg2" }));
    setTimeout(() => {
      timeout_happened = true;
    }, 100);
    await waitForExpect(() => expect(timeout_happened).toEqual(true));
    await waitForExpect(() => expect(last_received_message).toEqual(""));

    conn1.close();
  });

  it("superfluous data gets removed", async () => {
    let last_received_message = "{}";
    const conn1 = await connect();
    const conn2 = await connect();
    conn1.onmessage = (e) => (last_received_message = e.data);
    conn1.send(
      JSON.stringify({ additional: "foo", who: "user2", message: "msg2" })
    );
    await waitForExpect(() =>
      expect(JSON.parse(last_received_message)).toEqual({
        who: "user2",
        message: "msg2",
      })
    );

    conn1.close();
    conn2.close();
  });
});
