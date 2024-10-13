// src/App.js
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import VideoChat from "./VideoChat";

const socket = io("http://localhost:5000");

function App() {
  const [me, setMe] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [userToCall, setUserToCall] = useState("");
  const [signalData, setSignalData] = useState({});
  const [incomingCall, setIncomingCall] = useState(null); // State for incoming call data

  useEffect(() => {
    socket.on("me", (id) => setMe(id));
    socket.on("callaccepted", (signal) => {
      setSignalData(signal);
      setCallAccepted(true);
    });

    socket.on("callended", () => {
      setCallEnded(true);
      setCallAccepted(false);
    });

    socket.on("calluser", (data) => {
      // Handle incoming call
      setIncomingCall(data); // Store incoming call data
    });
  }, []);

  const callUser = (e) => {
    e.preventDefault();
    socket.emit("calluser", { userToCall, signalData: {}, from: me, name });
  };

  const answerCall = () => {
    if (incomingCall) {
      socket.emit("answercall", {
        signal: incomingCall.signal, // Pass along the signaling data
        to: incomingCall.from, // ID of the user who called
      });
      setSignalData(incomingCall.signal);
      setCallAccepted(true);
      setIncomingCall(null); // Clear incoming call after answering
    }
  };

  const declineCall = () => {
    if (incomingCall) {
      socket.emit("callended", { to: incomingCall.from });
      setIncomingCall(null); // Clear incoming call after declining
    }
  };

  return (
    <div>
      <h1>Video Chat</h1>
      <form onSubmit={callUser}>
        <input
          type="text"
          placeholder="Your Name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="User ID to Call"
          onChange={(e) => setUserToCall(e.target.value)}
        />
        <button type="submit">Call</button>
      </form>

      {incomingCall && (
        <div className="incoming-call">
          <h3>Incoming call from {incomingCall.name}</h3>
          <button onClick={answerCall}>Accept</button>
          <button onClick={declineCall}>Decline</button>
        </div>
      )}

      {callAccepted && !callEnded ? (
        <VideoChat name={name} signalData={signalData} />
      ) : null}
    </div>
  );
}

export default App;
