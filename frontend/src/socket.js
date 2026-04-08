import { io } from 'socket.io-client';

// 本機開發用 localhost:3001，部署後自動用同一個 origin
const URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

const socket = io(URL, {
  autoConnect: false,
});

export default socket;
