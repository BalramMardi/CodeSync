import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidV4 } from "uuid";
import * as Y from "yjs";
import Document from "./models/Document.js";
import { connectDB } from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN = process.env.CLIENT_URL;

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;

//----------------------------------------------------------------------------------


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

//----------------------------------------------------------------------------------



const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"]
  }
});

app.get("/api/create-room", (req, res) => {
  const roomId = uuidV4();
  res.json({ roomId });
});

const activeUsers = new Map();
const yDocs = new Map();

const SAVE_INTERVAL_MS = 10000; 

setInterval(async () => {
  for (const [documentId, ydoc] of yDocs.entries()) {
    try {
      const content = ydoc.getText("monaco").toString();
      await Document.findByIdAndUpdate(documentId, { content });
    } catch (error) {
      console.error(`Failed to auto-save document ${documentId}:`, error);
    }
  }
}, SAVE_INTERVAL_MS);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("get-document", async (documentId) => {
    try {
      if (!yDocs.has(documentId)) {
        const ydoc = new Y.Doc();
        const dbDoc = await findOrCreateDocument(documentId);
        ydoc.getText("monaco").insert(0, dbDoc.content || "");
        yDocs.set(documentId, ydoc);
      }

      const ydoc = yDocs.get(documentId);
      socket.join(documentId);
      
      const state = Y.encodeStateAsUpdate(ydoc);
      socket.emit("sync-document", state);

      if (!activeUsers.has(documentId)) {
        activeUsers.set(documentId, new Set());
      }
      activeUsers.get(documentId).add(socket.id);
      io.to(documentId).emit("users-update", Array.from(activeUsers.get(documentId)));

      socket.on("send-update", (update) => {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update));
          socket.broadcast.to(documentId).emit("receive-update", update);
        } catch (error) {
          console.error("Error applying Yjs update:", error);
        }
      });

      socket.on("disconnect", async () => {
        if (activeUsers.has(documentId)) {
          activeUsers.get(documentId).delete(socket.id);
          
          if (activeUsers.get(documentId).size === 0) {
            activeUsers.delete(documentId);
            
            try {
              const finalContent = yDocs.get(documentId).getText("monaco").toString();
              await Document.findByIdAndUpdate(documentId, { content: finalContent });
            } catch (error) {
              console.error(`Final save failed for ${documentId}:`, error);
            }
            
            yDocs.delete(documentId);
          } else {
            io.to(documentId).emit("users-update", Array.from(activeUsers.get(documentId)));
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  });
});

async function findOrCreateDocument(id) {
  if (!id) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, content: "" });
}

connectDB().then(() => {
  server.listen(PORT, () => {
    const mode = process.env.NODE_ENV || "development";
    console.log(`Server is running in ${mode} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error("Database connection failed. Server not started.", err);
  process.exit(1);
});