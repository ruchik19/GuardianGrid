
import { io } from 'socket.io-client';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

let socketInstance = null;
let connectedOnce = false;
let hasConnectedListener = false;
let roomsJoined = new Set();
let currentUserData = null;

export const initializeSocket = (user) => {
  currentUserData = user;

  if (socketInstance && socketInstance.connected) {
    console.log("[socket] Already connected as:", socketInstance.id);
    safeJoinRooms();
    return socketInstance;
  }

  if (!socketInstance) {
    socketInstance = io(`${BACKEND_URL}`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });

    console.log("[socket] Initializing socket...");
  }

  if (!hasConnectedListener) {
    hasConnectedListener = true;
    socketInstance.on('connect', () => {
      console.log("[socket] Connected. ID:", socketInstance.id);
      connectedOnce = true;
      safeJoinRooms();
    });

    socketInstance.on('disconnect', (reason) => {
      console.log("[socket] Disconnected:", reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.error("[socket] Connection error:", err.message);
    });
  }

  return socketInstance;
};

const safeJoinRooms = () => {
  if (!socketInstance?.connected || !currentUserData) return;

  const region = currentUserData.region?.toLowerCase();
  if (region && !roomsJoined.has(region)) {
    socketInstance.emit('joinRoom', region);
    roomsJoined.add(region);
    console.log("[socket] Joined region:", region);
  }

  if (currentUserData.role === 'armyofficial' && !roomsJoined.has('global')) {
    socketInstance.emit('joinRoom', 'global');
    roomsJoined.add('global');
    console.log("[socket] Joined global");
  }
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    console.log("[socket] Manually disconnecting.");
    socketInstance.disconnect();
    socketInstance = null;
    roomsJoined.clear();
    hasConnectedListener = false;
    connectedOnce = false;
  }
};
