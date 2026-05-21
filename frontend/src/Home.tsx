import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createNewRoom = async () => {
    try {
      const response = await fetch("/api/create-room");
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
    <>
      
      <div className="home-container">
        <nav className="nav-bar">
          <div className="nav-logo">CodeSync</div>
          {/* <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul> */}
        </nav>

        <div className="bioWave">
          <div className="wave-blur-1" />
          <div className="wave-blur-2" />
        </div>

        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="vignette" />

        <div className="content">
          <div className="card">
            <h1 className="title">Collaborative Editor</h1>
            <p className="subtitle">Paste an invitation ID to join a session</p>

            <form onSubmit={joinRoom} className="form">
              <input
                type="text"
                placeholder="ROOM ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input"
              />
              <button type="submit" className="button">
                Join Room
              </button>
            </form>

            <p className="subtitle">
              If you don't have an invite then create a{" "}
              <span className="link-text" onClick={createNewRoom}>
                new room
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}