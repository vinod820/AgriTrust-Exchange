"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Peer from "simple-peer";
import { io, Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Shield,
  AlertCircle
} from "lucide-react";

type PeerRef = {
  id: string;
  peer: Peer.Instance;
};

export default function CallPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [joined, setJoined] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [status, setStatus] = useState("Ready to join the verification room.");
  const [shareUrl, setShareUrl] = useState("");
  const [deviceReady, setDeviceReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [preparingDevices, setPreparingDevices] = useState(false);
  const [copied, setCopied] = useState(false);
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
    if (!video) return;
    video.srcObject = stream;
    video.muted = mutedVideo;
    try {
      await video.play();
    } catch {}
  }

  function getMediaErrorMessage(error: unknown) {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      return "Camera access needs a secure page (HTTPS).";
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
        return "No camera or microphone found on this device.";
      }
      if (name === "NotReadableError" || name === "TrackStartError") {
        return "Camera is busy in another app. Close it and try again.";
      }
    }
    return "Could not start camera and microphone.";
  }

  async function ensureLocalMedia() {
    if (streamRef.current) return streamRef.current;
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
      setStatus("Camera and microphone ready. Click 'Join Room' when ready.");
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
    if (joined) return;

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

    const socket = io(signalingUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("join-room", roomId);
    setStatus("Connecting to room... Waiting for other participant.");
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
      const message = "Could not connect to video server. Make sure the signaling service is running.";
      setJoined(false);
      setErrorText(message);
      setStatus(message);
    });

    socket.on("disconnect", () => {
      setJoined(false);
      setRemoteReady(false);
      setConnectedPeers([]);
      setStatus("Connection lost. You can rejoin the room.");
    });

    setJoined(true);
  }

  function createPeer(userToSignal: string, callerId: string, stream: MediaStream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current?.emit("sending-signal", { userToSignal, callerId, signal });
    });
    peer.on("stream", (remoteStream) => {
      void attachStream(remoteVideoRef.current, remoteStream);
      setRemoteReady(true);
      setStatus("Connected! You can now verify the produce together.");
    });
    return peer;
  }

  function addPeer(incomingSignal: Peer.SignalData, callerId: string, stream: MediaStream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning-signal", { signal, callerId });
    });
    peer.on("stream", (remoteStream) => {
      void attachStream(remoteVideoRef.current, remoteStream);
      setRemoteReady(true);
      setStatus("Live verification stream connected!");
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

  function endCall() {
    for (const item of peersRef.current) {
      item.peer.destroy();
    }
    peersRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.disconnect();
    setJoined(false);
    setDeviceReady(false);
    setRemoteReady(false);
    setConnectedPeers([]);
    setStatus("Call ended. You can start a new session.");
  }

  async function copyInviteLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Header */}
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-voice="go home open home page">
            <div className="nav-logo">KV</div>
            <div>
              <div className="nav-title">Video Verification</div>
              <div className="nav-subtitle">Live Inspection</div>
            </div>
          </Link>

          <div className="nav-actions">
            <Link href="/buyer" className="btn btn-secondary btn-sm" data-voice="back to marketplace open buyer page">
              <ArrowLeft size={16} />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, var(--brand-primary), #1A3D2A)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-2xl)",
            color: "var(--text-inverse)",
            marginBottom: "var(--space-xl)"
          }}
        >
          <span className="label" style={{ color: "var(--brand-secondary)", marginBottom: "var(--space-sm)", display: "block" }}>
            Live Verification Room
          </span>
          <h1 style={{ color: "var(--text-inverse)", marginBottom: "var(--space-md)" }}>
            Verify Produce Before Payment
          </h1>
          <p style={{ opacity: 0.8, maxWidth: 600 }}>
            This secure space allows farmers and buyers to inspect crops together via video call before locking payment in escrow.
          </p>
          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
            <span className="badge" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              <Users size={14} /> Room: {roomId}
            </span>
            <span className="badge" style={{ background: joined ? "var(--accent-success)" : "rgba(255,255,255,0.15)", color: "white" }}>
              {joined ? "Connected" : "Not Connected"}
            </span>
            <span className="badge" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              {connectedPeers.length} Participant{connectedPeers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
          {/* Video Section */}
          <div className="card card-lg">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
              <div>
                <h3>Video Call</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 4 }}>{status}</p>
              </div>
              <span className={`badge ${joined && remoteReady ? "badge-success" : "badge-warning"}`}>
                {joined && remoteReady ? "Live" : joined ? "Waiting" : "Preview"}
              </span>
            </div>

            {errorText && (
              <div style={{
                padding: "var(--space-md)",
                background: "rgba(226, 92, 61, 0.1)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-lg)",
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-md)"
              }}>
                <AlertCircle size={20} color="var(--accent-warning)" />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--accent-warning)" }}>Connection Issue</div>
                  <p style={{ fontSize: "0.875rem", marginTop: 2 }}>{errorText}</p>
                </div>
              </div>
            )}

            {/* Video Grid */}
            <div className="video-grid" style={{ marginBottom: "var(--space-lg)" }}>
              <div className="video-tile">
                <div className="video-placeholder" style={{ display: deviceReady ? "none" : "flex" }}>
                  <Video size={48} style={{ opacity: 0.5 }} />
                  <span>Click "Preview Camera" to start</span>
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: deviceReady ? "block" : "none"
                  }}
                />
                <span className="video-label">You</span>
              </div>

              <div className="video-tile">
                <div className="video-placeholder" style={{ display: remoteReady ? "none" : "flex" }}>
                  <Users size={48} style={{ opacity: 0.5 }} />
                  <span>Waiting for other participant...</span>
                </div>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: remoteReady ? "block" : "none"
                  }}
                />
                <span className="video-label">{remoteReady ? "Farmer/Buyer" : "Waiting..."}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="video-controls">
              {!joined ? (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={previewDevices}
                    disabled={preparingDevices || deviceReady}
                    data-testid="preview-btn"
                    data-voice="preview camera start camera prepare devices video call start video call camera on camera ons open camera connect camera"
                  >
                    <Video size={18} />
                    {preparingDevices ? "Starting..." : deviceReady ? "Camera Ready" : "Preview Camera"}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={joinRoom}
                    disabled={!deviceReady}
                    data-testid="join-btn"
                    data-voice="join room start call enter room connect buyer call buyer connect call"
                  >
                    <Phone size={18} />
                    Join Room
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`video-control-btn ${muted ? "btn-primary" : ""}`}
                    onClick={toggleMute}
                    title={muted ? "Unmute" : "Mute"}
                    data-voice={muted ? "unmute turn microphone on" : "mute turn microphone off"}
                  >
                    {muted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
                  <button
                    className={`video-control-btn ${!cameraOn ? "btn-primary" : ""}`}
                    onClick={toggleCamera}
                    title={cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                    data-voice={cameraOn ? "camera off turn camera off stop camera video off" : "camera on camera ons turn camera on start camera video on"}
                  >
                    {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                  </button>
                  <button
                    className="video-control-btn end-call"
                    onClick={endCall}
                    title="End Call"
                    data-testid="end-call-btn"
                    data-voice="end call hang up leave room"
                  >
                    <PhoneOff size={22} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
            {/* Invite Card */}
            <div className="card card-lg">
              <h3 style={{ marginBottom: "var(--space-md)" }}>Invite Participant</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-md)" }}>
                Share this link with the farmer or buyer to join the verification call.
              </p>
              
              <div style={{
                padding: "var(--space-md)",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.75rem",
                wordBreak: "break-all",
                marginBottom: "var(--space-md)"
              }}>
                {shareUrl || "Loading..."}
              </div>

              <button
                className="btn btn-secondary"
                onClick={copyInviteLink}
                style={{ width: "100%" }}
                data-testid="copy-link-btn"
                data-voice="copy invite link share room link"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Link Copied!" : "Copy Invite Link"}
              </button>
            </div>

            {/* Checklist */}
            <div className="card card-lg">
              <h3 style={{ marginBottom: "var(--space-lg)" }}>Verification Checklist</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                {[
                  { title: "Preview your camera", desc: "Ensure camera and mic work before joining" },
                  { title: "Check produce visually", desc: "Inspect freshness, packaging, and lot quality" },
                  { title: "Confirm details", desc: "Verify quantity, grade, and pricing" },
                  { title: "Move to escrow", desc: "Lock payment securely after agreement" }
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "var(--space-md)",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)"
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Note */}
            <div className="card" style={{ background: "rgba(45, 90, 63, 0.08)", borderColor: "var(--brand-primary)" }}>
              <div style={{ display: "flex", gap: "var(--space-md)" }}>
                <Shield size={24} color="var(--brand-primary)" />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Secure Connection</div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
                    This call is end-to-end encrypted using WebRTC. No video data is stored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
