import React from "react";
import "./App.css";
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

const sock = new SockJS(backend_url);
sock.onopen = function () {
  console.log("open");
  sock.send("test");
};

sock.onmessage = function (e) {
  console.log("message", e.data);
  sock.close();
};

sock.onclose = function () {
  console.log("close");
};

function App() {
  return <div>hello</div>;
}

export default App;
