import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

interface Room {
  sockets: WebSocket[];
}
const rooms: Record<string, Room> = {
  default: { sockets: [] },
};

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);

    const message = JSON.parse(data.toString());
    if (message.type === 'join') {
      const roomName = message.room || 'default';
      if (!rooms[roomName]) {
        rooms[roomName] = { sockets: [] };
      }
      rooms[roomName].sockets.push(ws);
      ws.send(JSON.stringify({ type: 'joined', room: roomName }));
    }

    if (message.type === 'leave') {
      const roomName = message.room || 'default';
      if (rooms[roomName]) {
        rooms[roomName].sockets = rooms[roomName].sockets.filter(
          socket => socket !== ws
        );
        ws.send(JSON.stringify({ type: 'left', room: roomName }));
      }
    }

    if (message.type === 'message') {
      const roomName = message.room || 'default';
      if (rooms[roomName]) {
        rooms[roomName].sockets.forEach(socket => {
          if (socket !== ws && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'message',
                room: roomName,
                content: message.content,
              })
            );
          }
        });
      }
    }

    if (message.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  });

  ws.send('something');
});
