// src/lib/socket.ts
import { io, type Socket } from "socket.io-client";
import type { Feature, Point } from "geojson";
import { useDroneStore } from "../store/droneStore";

let socket: Socket | null = null;
let isConnected = false;

type SocketMessage = {
  /** GeoJSON features with Point geometry pushed from the backend */
  features?: Array<Feature<Point, any>>;
};

export function startSocket(): Socket {
  if (socket && isConnected) return socket;

  const { upsertFeature } = useDroneStore.getState();

  socket = io("http://localhost:9013", {
    transports: ["polling"],
    path: "/socket.io",
    withCredentials: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    isConnected = true;
    console.log("Socket connected");
  });

  socket.on("disconnect", () => {
    isConnected = false;
    console.log("Socket disconnected");
  });

  socket.on("message", (payload: SocketMessage) => {
    const features = payload?.features ?? [];
    for (const f of features) upsertFeature(f);
  });

  return socket;
}
