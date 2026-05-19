import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import CodeEditor from "./CodeEditor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/document/:documentId" element={<CodeEditor />} />
      </Routes>
    </Router>
  );
}

export default App;