import { io, Socket } from "socket.io-client";

// In dev, connect to the backend on 8090; in prod, same origin
const SOCKET_URL =
	import.meta.env.MODE === "development"
		? "http://localhost:8090"
		: window.location.origin;

const socket: Socket = io(SOCKET_URL, {
	autoConnect: true,
});

export default socket;
