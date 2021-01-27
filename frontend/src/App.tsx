import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";

const backend_port = window.location.port === "3000" ? "3001" : null;

const backend_url =
  (window.location.port === "3000"
    ? window.location.protocol +
      "//" +
      window.location.hostname +
      ":" +
      backend_port
    : "") + "/api";

type Message = {
  who: string;
  message: string;
};

type Connection = {
  send_message: (message: Message) => void;
  close: () => void;
};

function connect(on_message: (message: Message) => void): Connection {
  let sock: WebSocket | null = new SockJS(backend_url);
  let is_closed = false;
  sock.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (typeof data != "object") {
      return;
    }
    if (typeof data.who != "string") {
      return;
    }
    if (typeof data.message != "string") {
      return;
    }
    on_message({ who: data.who, message: data.message });
  };
  sock.onclose = function () {
    sock = null;
    setTimeout(() => {
      if (!is_closed) {
        sock = new SockJS(backend_url);
      }
    }, 2000); //reconnect
  };
  return {
    close: () => {
      is_closed = true;
      if (sock != null) {
        sock.close();
      }
    },
    send_message: (message: Message) => {
      if (sock && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify(message));
      }
    },
  };
}

const amount_of_messages_to_retain = 5;

function App() {
  const [messages, set_messages] = useState<Message[]>([]);
  const [name, set_name] = useState<string>("");
  const [text, set_text] = useState<string>("");
  const [send_message, set_send_message] = useState<(message: Message) => void>(
    () => (_message: Message) => {}
  );

  useEffect(
    () => {
      const connection = connect((message) => {
        set_messages((prev) => {
          return prev
            .concat([message])
            .filter(
              (_msg, index) =>
                prev.length - index < amount_of_messages_to_retain
            );
        });
      });
      set_send_message(() => connection.send_message);

      //close when effect ends
      return connection.close;
    },
    [] /*do once*/
  );
  return (
    <div>
      <div className="messages">
        Mein Text
        <table>
          <thead>
            <tr>
              <th>Wer</th>
              <th>Nachricht</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr>
                <td>{message.who}</td>
                <td>{message.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send_message({ who: name, message: text });
          set_text("");
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => set_name(e.target.value)}
          placeholder="Name"
        />
        <textarea value={text} onChange={(e) => set_text(e.target.value)} />
        <button type="submit">Senden</button>
      </form>
    </div>
  );
}

export default App;
