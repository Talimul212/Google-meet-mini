// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Server is Running.");
});

io.on("connection", (socket) => {
  // Send the unique socket ID to the client when they connect
  socket.emit("me", socket.id);
  console.log(`User connected: ${socket.id}`); // Log user ID

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`); // Log when a user disconnects
    socket.broadcast.emit("callended");
  });

  // Handle call requests
  socket.on("calluser", (data) => {
    console.log(`Call request from ${data.from} to ${data.userToCall}`); // Log call details

    // Emit the call to the user being called
    io.to(data.userToCall).emit("calluser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  // Handle answering the call
  socket.on("answercall", (data) => {
    console.log(`Call accepted from ${data.from} to ${data.to}`); // Log call acceptance
    io.to(data.to).emit("callaccepted", data.signal);
  });
});

// Start the server
server.listen(PORT, () => console.log(`server listening on port ${PORT}`));
