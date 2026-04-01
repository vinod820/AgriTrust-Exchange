const { createServer } = require("http");
const { Server } = require("socket.io");

const port = process.env.PORT || 4001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
    const otherUsers = [...room].filter((id) => id !== socket.id);
    socket.emit("all-users", otherUsers);
  });

  socket.on("sending-signal", ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit("user-joined", {
      signal,
      callerId
    });
  });

  socket.on("returning-signal", ({ callerId, signal }) => {
    io.to(callerId).emit("receiving-returned-signal", {
      id: socket.id,
      signal
    });
  });
});

httpServer.listen(port, () => {
  console.log(`AgriTrust signaling server listening on ${port}`);
});

