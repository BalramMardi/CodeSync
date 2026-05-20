import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createNewRoom = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-room`);
      const data = await response.json();
      navigate(`/document/${data.roomId}`);
    } catch (error) {
      console.error(error);
    }
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/document/${roomId.trim()}`);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1e1e", color: "#d4d4d4", fontFamily: "sans-serif" }}>
      <div style={{ padding: "40px", backgroundColor: "#252526", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <h1 style={{ marginBottom: "20px", color: "#61dafb" }}>Collaborative Editor</h1>
        
        <p style={{ marginBottom: "20px" }}>Paste an invitation ID to join a session</p>
        
        <form onSubmit={joinRoom} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="ROOM ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #3c3c3c", backgroundColor: "#3c3c3c", color: "#fff", outline: "none" }}
          />
          <button type="submit" style={{ padding: "10px", borderRadius: "4px", border: "none", backgroundColor: "#007acc", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
            Join Room
          </button>
        </form>

        <p style={{ marginBottom: "20px", fontSize: "14px" }}>
          If you don't have an invite then create a <span onClick={createNewRoom} style={{ color: "#61dafb", cursor: "pointer", textDecoration: "underline" }}>new room</span>.
        </p>
      </div>
    </div>
  );
}