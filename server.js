import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
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

io.on("connection", (socket) => {
  
  console.log(`🟢 User connected to the editor: ${socket.id}`);

  socket.on("get-document", async (documentId) => {
    try {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);
      
      
      console.log(`🏟️ User ${socket.id} joined the editor: ${documentId}`);
      
      socket.emit("load-document", document.content);

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        await Document.findByIdAndUpdate(documentId, { content: data });
      });
    } catch (error) {
      console.error(error);
    }
  });

  
  socket.on("disconnect", () => {
    console.log(`🔴 User exited the editor: ${socket.id}`);
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