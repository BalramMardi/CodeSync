import { useEffect, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

export default function CodeEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const [socket, setSocket] = useState<Socket>();
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [copyText, setCopyText] = useState("Copy Room ID");

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL);
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || documentId == null || editorInstance == null) return;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("monaco");
    
    const binding = new MonacoBinding(ytext, editorInstance.getModel(), new Set([editorInstance]));

    socket.emit("get-document", documentId);

    socket.on("sync-document", (state: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(state));
    });

    socket.on("receive-update", (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), socket);
    });

    ydoc.on("update", (update: Uint8Array, origin: any) => {
      if (origin !== socket) {
        socket.emit("send-update", update);
      }
    });

    return () => {
      binding.destroy();
      ydoc.destroy();
      socket.off("sync-document");
      socket.off("receive-update");
    };
  }, [socket, documentId, editorInstance]);

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
  };

  const copyLink = () => {
    if (documentId) {
      navigator.clipboard.writeText(documentId);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy Room ID"), 2000);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", backgroundColor: "#1e1e1e", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 20px", backgroundColor: "#252526", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #3c3c3c" }}>
        <span style={{ color: "#d4d4d4", fontFamily: "sans-serif", fontSize: "14px" }}>Room: {documentId}</span>
        <button onClick={copyLink} style={{ padding: "6px 12px", backgroundColor: "#007acc", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          {copyText}
        </button>
      </div>
      
      <div style={{ flexGrow: 1 }}>
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="typescript"
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}