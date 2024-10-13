// src/VideoChat.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const VideoChat = ({ name }) => {
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const socket = useRef();

  const [incomingCall, setIncomingCall] = useState(null); // State to manage incoming call

  useEffect(() => {
    // Initialize the socket connection
    socket.current = io("http://localhost:5000");

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;

        const peer = new RTCPeerConnection();
        peerRef.current = peer;

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.current.emit("sendCandidate", {
              candidate: event.candidate,
            });
          }
        }; // Make sure to close this function properly

        // Listen for incoming calls
        socket.current.on("calluser", (data) => {
          setIncomingCall(data); // Set incoming call data
        });

        // Handle remote track
        peer.ontrack = (event) => {
          partnerVideo.current.srcObject = event.streams[0];
        };

        // Listen for call acceptance
        socket.current.on("callaccepted", (signal) => {
          peer.setRemoteDescription(new RTCSessionDescription(signal));
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    return () => {
      socket.current.disconnect(); // Clean up the socket connection
    };
  }, []);

  const answerCall = () => {
    const data = incomingCall;
    socket.current.emit("answercall", {
      signal: data.signal,
      to: data.from,
    });
    peerRef.current.setRemoteDescription(
      new RTCSessionDescription(data.signal)
    );
    setIncomingCall(null); // Clear the incoming call state
  };

  const declineCall = () => {
    socket.current.emit("callended", { to: incomingCall.from });
    setIncomingCall(null); // Clear the incoming call state
  };

  return (
    <div>
      <video playsInline ref={userVideo} autoPlay />
      <video playsInline ref={partnerVideo} autoPlay />
      <h2>{name}</h2>

      {/* Incoming call notification */}
      {incomingCall && (
        <div className="incoming-call">
          <h3>Incoming call from {incomingCall.name}</h3>
          <button onClick={answerCall}>Accept</button>
          <button onClick={declineCall}>Decline</button>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
