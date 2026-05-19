import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import CodeEditor from "./CodeEditor.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/document/${uuidV4()}`} replace />} />
        <Route path="/document/:documentId" element={<CodeEditor />} />
      </Routes>
    </Router>
  );
}

export default App;