import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidV4 } from "uuid";
import Document from "./models/Document.js";
import { connectDB } from "./config/db.js";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/api/create-room", (req, res) => {
  const roomId = uuidV4();
  res.json({ roomId });
});

const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("get-document", async (documentId) => {
    try {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);
      console.log(`User ${socket.id} joined room: ${documentId}`);
      
      socket.emit("load-document", document.content);

      if (!activeUsers.has(documentId)) {
        activeUsers.set(documentId, new Set());
      }
      activeUsers.get(documentId).add(socket.id);

      io.to(documentId).emit("users-update", Array.from(activeUsers.get(documentId)));

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        await Document.findByIdAndUpdate(documentId, { content: data });
      });

      socket.on("disconnect", () => {
        if (activeUsers.has(documentId)) {
          activeUsers.get(documentId).delete(socket.id);
          if (activeUsers.get(documentId).size === 0) {
            activeUsers.delete(documentId);
          } else {
            io.to(documentId).emit("users-update", Array.from(activeUsers.get(documentId)));
          }
        }
      });

    } catch (error) {
      console.error(error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

async function findOrCreateDocument(id) {
  if (!id) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, content: "" });
}

server.listen(PORT, () => {
  const mode = process.env.NODE_ENV || "development";
  console.log(`Server is running in ${mode} mode on port ${PORT}`);
});