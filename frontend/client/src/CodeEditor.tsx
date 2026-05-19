import { useEffect, useRef, useState } from "react";
import Editor, {type OnMount,type OnChange } from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";

const SAVE_INTERVAL_MS = 2000;

export default function CodeEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const [socket, setSocket] = useState<Socket>();
  const editorRef = useRef<any>(null);
  const isRemoteUpdate = useRef<boolean>(false);
  const [copyText, setCopyText] = useState("Copy Room Link");

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (socket == null || documentId == null) return;
    
    socket.emit("get-document", documentId);

    socket.once("load-document", (document: string) => {
      if (editorRef.current) {
        isRemoteUpdate.current = true;
        editorRef.current.setValue(document || "");
        isRemoteUpdate.current = false;
      }
    });

    const handler = (delta: any) => {
      if (editorRef.current) {
        isRemoteUpdate.current = true;
        editorRef.current.executeEdits(null, delta.changes);
        isRemoteUpdate.current = false;
      }
    };
    
    socket.on("receive-changes", handler);
    return () => { socket.off("receive-changes", handler); };
  }, [socket, documentId]);

  useEffect(() => {
    if (socket == null) return;
    const interval = setInterval(() => {
      if (editorRef.current) {
        socket.emit("save-document", editorRef.current.getValue());
      }
    }, SAVE_INTERVAL_MS);
    return () => { clearInterval(interval); };
  }, [socket]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value, event) => {
    if (isRemoteUpdate.current) return;
    if (socket == null) return;
    socket.emit("send-changes", { changes: event.changes });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Room Link"), 2000);
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
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
}