"use client";

import Peer from "simple-peer";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

type PeerRef = {
  id: string;
  peer: Peer.Instance;
};

export function VideoRoomClient({ roomId }: { roomId: string }) {
  const [joined, setJoined] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [status, setStatus] = useState("Ready to join the verification room.");
  const [shareUrl, setShareUrl] = useState("");
  const [deviceReady, setDeviceReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [preparingDevices, setPreparingDevices] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy invite link");
  const [errorText, setErrorText] = useState("");
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<PeerRef[]>([]);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    return () => {
      for (const item of peersRef.current) {
        item.peer.destroy();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      socketRef.current?.disconnect();
    };
  }, []);

  async function attachStream(video: HTMLVideoElement | null, stream: MediaStream, mutedVideo = false) {
    if (!video) {
      return;
    }

    video.srcObject = stream;
    video.muted = mutedVideo;

    try {
      await video.play();
    } catch {}
  }

  function getMediaErrorMessage(error: unknown) {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      return "Camera access needs a secure page. Open the app on http://localhost:3105 or HTTPS.";
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return "This browser does not support camera access.";
    }

    if (error && typeof error === "object" && "name" in error) {
      const name = String((error as { name?: string }).name);

      if (name === "NotAllowedError" || name === "SecurityError") {
        return "Camera permission was blocked. Allow camera and microphone access, then try again.";
      }

      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        return "No camera or microphone was found on this device.";
      }

      if (name === "NotReadableError" || name === "TrackStartError") {
        return "Your camera is busy in another app. Close the other app and try again.";
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return "Could not start the camera and microphone.";
  }

  async function ensureLocalMedia() {
    if (streamRef.current) {
      return streamRef.current;
    }

    setPreparingDevices(true);
    setErrorText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      await attachStream(localVideoRef.current, stream, true);
      setDeviceReady(true);
      setStatus("Camera and microphone are ready. Join the room when you are ready.");
      return stream;
    } catch (error) {
      const message = getMediaErrorMessage(error);
      setErrorText(message);
      setStatus(message);
      throw error;
    } finally {
      setPreparingDevices(false);
    }
  }

  async function previewDevices() {
    try {
      await ensureLocalMedia();
    } catch {}
  }

  async function joinRoom() {
    if (joined) {
      return;
    }

    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL ?? "http://localhost:4001";
    let stream: MediaStream;

    try {
      stream = await ensureLocalMedia();
    } catch {
      return;
    }

    for (const item of peersRef.current) {
      item.peer.destroy();
    }
    peersRef.current = [];
    socketRef.current?.disconnect();
    setConnectedPeers([]);
    setRemoteReady(false);

    const socket = io(signalingUrl, {
      transports: ["websocket"]
    });
    socketRef.current = socket;

    socket.emit("join-room", roomId);
    setStatus("Joining signaling room and waiting for the other participant.");
    setErrorText("");

    socket.on("all-users", (users: string[]) => {
      const peers: PeerRef[] = [];
      for (const userId of users) {
        const peer = createPeer(userId, socket.id ?? "", stream);
        peers.push({ id: userId, peer });
      }
      peersRef.current = peers;
      setConnectedPeers(users);
    });

    socket.on("user-joined", (payload: { callerId: string; signal: Peer.SignalData }) => {
      const peer = addPeer(payload.signal, payload.callerId, stream);
      peersRef.current.push({ id: payload.callerId, peer });
      setConnectedPeers((current) => [...new Set([...current, payload.callerId])]);
    });

    socket.on("receiving-returned-signal", (payload: { id: string; signal: Peer.SignalData }) => {
      const item = peersRef.current.find((peer) => peer.id === payload.id);
      item?.peer.signal(payload.signal);
    });

    socket.on("connect_error", () => {
      const message = "The video server could not be reached. Keep the signaling service running on port 4001.";
      setJoined(false);
      setErrorText(message);
      setStatus(message);
    });

    socket.on("disconnect", () => {
      setJoined(false);
      setRemoteReady(false);
      setConnectedPeers([]);
      setStatus("Connection lost. You can preview again and rejoin the room.");
    });

    setJoined(true);
  }

  function createPeer(userToSignal: string, callerId: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("sending-signal", {
        userToSignal,
        callerId,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      void attachStream(remoteVideoRef.current, remoteStream);
      setRemoteReady(true);
      setStatus("Buyer and farmer are now connected live.");
    });

    return peer;
  }

  function addPeer(incomingSignal: Peer.SignalData, callerId: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning-signal", {
        signal,
        callerId
      });
    });

    peer.on("stream", (remoteStream) => {
      void attachStream(remoteVideoRef.current, remoteStream);
      setRemoteReady(true);
      setStatus("Live verification stream connected.");
    });

    peer.signal(incomingSignal);
    return peer;
  }

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }

  function toggleCamera() {
    const next = !cameraOn;
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
  }

  async function copyInviteLink() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyLabel("Invite link copied");
      setTimeout(() => setCopyLabel("Copy invite link"), 2000);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy invite link"), 2000);
    }
  }

  return (
    <main className="page-stack">
      <section className="card call-hero">
        <div>
          <p className="eyebrow">Live verification room</p>
          <h1>Verify produce before payment is locked.</h1>
          <p>
            This space is for the farmer and buyer to inspect the lot together, confirm trust, and move into escrow with
            more confidence.
          </p>
        </div>
        <div className="tag-row">
          <span className="tag">Room {roomId}</span>
          <span className="tag">Connected peers: {connectedPeers.length}</span>
          <span className="tag">{joined ? "Room active" : deviceReady ? "Camera ready" : "Preview needed"}</span>
        </div>
      </section>

      <div className="call-grid">
        <section className="card">
          <div className="panel-title-row">
            <div>
              <p className="kicker">Video verification</p>
              <h3>Farmer and buyer live view</h3>
            </div>
            <span className={`status-pill ${joined ? "status-success" : "status-warning"}`}>
              {joined ? "Connected" : "Waiting"}
            </span>
          </div>
          <p>{status}</p>
          {errorText ? (
            <div className="notice-card">
              <strong>Camera or room issue</strong>
              <p>{errorText}</p>
            </div>
          ) : null}
          <div className="video-duo-grid">
            <div className="video-tile">
              <span className="video-label">Your camera</span>
              <div className="video-stage-shell">
                {!deviceReady ? <div className="video-placeholder">Click "Preview camera" to test your camera and mic.</div> : null}
                <video className="video-stage" ref={localVideoRef} autoPlay muted playsInline />
              </div>
            </div>
            <div className="video-tile">
              <span className="video-label">Remote camera</span>
              <div className="video-stage-shell">
                {!remoteReady ? <div className="video-placeholder">Waiting for the other participant to join.</div> : null}
                <video className="video-stage" ref={remoteVideoRef} autoPlay playsInline />
              </div>
            </div>
          </div>
          <div className="button-row">
            <button className="button" onClick={previewDevices} disabled={preparingDevices}>
              {preparingDevices ? "Preparing devices..." : deviceReady ? "Preview ready" : "Preview camera"}
            </button>
            {!joined ? (
              <button className="button" onClick={joinRoom}>
                Join room
              </button>
            ) : null}
            <button className="ghost-button" onClick={toggleMute} disabled={!deviceReady}>
              {muted ? "Unmute" : "Mute"}
            </button>
            <button className="ghost-button" onClick={toggleCamera} disabled={!deviceReady}>
              {cameraOn ? "Camera off" : "Camera on"}
            </button>
          </div>
        </section>

        <div className="sidebar-stack">
          <aside className="card">
            <p className="kicker">Share</p>
            <h3>Invite the other participant</h3>
            <p className="mono">{shareUrl || "Loading room URL..."}</p>
            <div className="button-row">
              <button className="ghost-button" onClick={copyInviteLink}>
                {copyLabel}
              </button>
            </div>
            <div className="asset-chip-row">
              <span className="asset-chip">One-to-one verification</span>
              <span className="asset-chip">WebRTC + Socket.IO</span>
              <span className="asset-chip">Mic and camera controls</span>
            </div>
          </aside>

          <aside className="card support-card">
            <p className="kicker">Checklist</p>
            <h3>Before the deal closes</h3>
            <div className="support-list">
              <div className="support-list-item">
                <strong>Preview your camera first</strong>
                <p>Make sure your camera and mic work before you try to join the room.</p>
              </div>
              <div className="support-list-item">
                <strong>Check the produce visually</strong>
                <p>Use the live feed to verify freshness, packaging, and lot readiness.</p>
              </div>
              <div className="support-list-item">
                <strong>Move to escrow next</strong>
                <p>After agreement, return to the listing and lock payment safely.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
