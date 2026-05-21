import * as Y from "yjs";
import Document from "../models/Document.js";

const activeUsers = new Map();
const yDocs = new Map();
const ttlTime = parseInt(process.env.TTL_TIME) || 10;
const DOOM_DAY = ttlTime * 24 * 60 * 60 * 1000;
const SAVE_INTERVAL_MS = 10000;

export const startAutoSave = () => {
  setInterval(async () => {
    for (const [documentId, ydoc] of yDocs.entries()) {
      try {
        const content = ydoc.getText("monaco").toString();
        await Document.findByIdAndUpdate(documentId, {
          content,
          expiresAt: new Date(Date.now() + DOOM_DAY)
        });
      } catch (error) {
        console.error(error);
      }
    }
  }, SAVE_INTERVAL_MS);
};

async function findOrCreateDocument(id) {
  if (!id) return;
  const document = await Document.findById(id);
  const newExpiry = new Date(Date.now() + DOOM_DAY);
  
  if (document) {
    document.expiresAt = newExpiry;
    await document.save();
    return document;
  }
  
  return await Document.create({ 
    _id: id, 
    content: "",
    expiresAt: newExpiry
  });
}

export const handleSocketConnection = (socket, io) => {
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
          console.error(error);
        }
      });

      socket.on("disconnect", async () => {
        if (activeUsers.has(documentId)) {
          activeUsers.get(documentId).delete(socket.id);
          
          if (activeUsers.get(documentId).size === 0) {
            activeUsers.delete(documentId);
            
            try {
              const finalContent = yDocs.get(documentId).getText("monaco").toString();
              await Document.findByIdAndUpdate(documentId, { 
                content: finalContent,
                expiresAt: new Date(Date.now() + DOOM_DAY)
              });
            } catch (error) {
              console.error(error);
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
};