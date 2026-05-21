import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import roomRoutes from "./routes/roomRoutes.js";
import { handleSocketConnection, startAutoSave } from "./controllers/socketController.js";

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

app.use("/api", roomRoutes);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"]
  }
});

startAutoSave();
io.on("connection", (socket) => handleSocketConnection(socket, io));

if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "../frontend/dist");
  
  app.use(express.static(clientDistPath));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

connectDB().then(() => {
  server.listen(PORT, () => {
    const mode = process.env.NODE_ENV || "development";
    console.log(`Server is running in ${mode} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error(err);
  process.exit(1);
});