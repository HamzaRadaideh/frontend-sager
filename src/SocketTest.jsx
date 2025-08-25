import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function SocketTest() {
  const [status, setStatus] = useState("disconnected");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:9013", {
      transports: ["polling"],
      path: "/socket.io",
      withCredentials: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => setStatus(`connected ${socket.id}`));
    socket.on("message", (data) => setMessages((m) => [data, ...m].slice(0, 50)));
    socket.on("disconnect", (reason) => setStatus(`disconnected (${reason})`));
    socket.on("connect_error", (err) => setStatus(`error: ${err.message}`));

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 8 }}>
      {/* <h3>Status: {status}</h3> */}
      <pre style={{ maxHeight: "30vh", maxWidth: "30vw", overflow: "hidden", border: "1px solid #ccc", padding: 8, background: "#123456" }}>
        {messages.map((m, i) => JSON.stringify(m, null, 2) + "\n\n")}
      </pre>
    </div>
  );
}
