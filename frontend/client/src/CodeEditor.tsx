import { useEffect, useRef, useState } from "react";
import  Editor, {type OnMount,type OnChange } from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";

const SAVE_INTERVAL_MS = 2000;

export default function CodeEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const [socket, setSocket] = useState<Socket>();
  const editorRef = useRef<any>(null);
  const isRemoteUpdate = useRef<boolean>(false);

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null) return;
    
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

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, documentId]);

  useEffect(() => {
    if (socket == null) return;

    const interval = setInterval(() => {
      if (editorRef.current) {
        socket.emit("save-document", editorRef.current.getValue());
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value, event) => {
    if (isRemoteUpdate.current) return;
    if (socket == null) return;
    socket.emit("send-changes", { changes: event.changes });
  };

  return (
    <div style={{ height: "100vh", width: "100vw", backgroundColor: "#1e1e1e" }}>
      <Editor
        height="100%"
        theme="vs-dark"
        defaultLanguage="typescript"
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
    </div>
  );
}