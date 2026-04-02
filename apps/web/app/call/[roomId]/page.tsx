"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Shield,
  Users,
  Video,
  VideoOff
} from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";
import { addVerificationWithWallet, getVerificationTrustAdminAddress, getWalletAddress } from "@/lib/contracts/client";
import type { Listing } from "@/lib/types";
import styles from "./page.module.css";

type JitsiEventPayload = Record<string, unknown> | undefined;

type JitsiApi = {
  addListener: (event: string, listener: (payload?: JitsiEventPayload) => void) => void;
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
};

type JitsiApiConstructor = new (domain: string, options: Record<string, unknown>) => JitsiApi;

type WindowWithJitsi = Window & {
  JitsiMeetExternalAPI?: JitsiApiConstructor;
};

let jitsiScriptPromise: Promise<void> | null = null;

function sanitizeRoomName(roomId: string) {
  const sanitized = roomId.replace(/[^a-zA-Z0-9-_]/g, "-");
  return `mahakrishi-${sanitized}`.slice(0, 80);
}

function buildMeetingUrl(domain: string, roomName: string) {
  return `https://${domain}/${roomName}`;
}

function getQualityScore(listing: Listing | null) {
  if (listing?.aiAnalysis?.confidence) {
    return Math.max(0, Math.min(100, Math.round(listing.aiAnalysis.confidence * 100)));
  }

  if (listing?.qualityGrade === "A+") {
    return 96;
  }

  if (listing?.qualityGrade === "A") {
    return 88;
  }

  if (listing?.qualityGrade === "B") {
    return 72;
  }

  return 85;
}

function loadJitsiScript(domain: string) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if ((window as WindowWithJitsi).JitsiMeetExternalAPI) {
    return Promise.resolve();
  }

  if (!jitsiScriptPromise) {
    jitsiScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-jitsi-external-api='true']");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => {
            jitsiScriptPromise = null;
            reject(new Error("Jitsi Meet failed to load. Check your connection or browser privacy settings."));
          },
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.dataset.jitsiExternalApi = "true";
      script.onload = () => resolve();
      script.onerror = () => {
        jitsiScriptPromise = null;
        reject(new Error("Jitsi Meet failed to load. Check your connection or browser privacy settings."));
      };
      document.body.appendChild(script);
    });
  }

  return jitsiScriptPromise;
}

function getEventFlag(payload: JitsiEventPayload, key: string) {
  return Boolean(payload && typeof payload === "object" && key in payload ? payload[key] : false);
}

function getEventText(payload: JitsiEventPayload, key: string) {
  const value = payload && typeof payload === "object" && key in payload ? payload[key] : "";
  return typeof value === "string" ? value : "";
}

function getErrorText(payload: JitsiEventPayload) {
  const directMessage = getEventText(payload, "message").trim();
  if (directMessage) {
    return directMessage;
  }

  const details = getEventText(payload, "details").trim();
  if (details) {
    return details;
  }

  const name = getEventText(payload, "name").trim();
  if (name) {
    return name.replace(/[_-]+/g, " ");
  }

  return "";
}

function isFatalJitsiError(payload: JitsiEventPayload) {
  const explicitFatal = getEventFlag(payload, "isFatal");
  if (explicitFatal) {
    return true;
  }

  const severity = `${getEventText(payload, "type")} ${getEventText(payload, "name")} ${getErrorText(payload)}`.toLowerCase();
  return ["connection", "conference", "config", "network", "notallowederror", "notfounderror", "security"].some((term) =>
    severity.includes(term)
  );
}

function getVerificationRoomStatus(joined: boolean, remoteParticipants: number) {
  if (!joined) {
    return "Preparing room";
  }

  if (remoteParticipants > 0) {
    return "Two-way call live";
  }

  return "Waiting for second user";
}

function canFallbackToWalletVerification(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes("private key") ||
    normalized.includes("server wallet") ||
    normalized.includes("admin wallet") ||
    normalized.includes("only admin")
  );
}

function isUserRejectedWalletAction(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 4001) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("user rejected") || message.includes("user denied");
}

export default function CallPage() {
  const params = useParams();
  const roomId = String(params.roomId ?? "demo");
  const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si";
  const jitsiRoomName = useMemo(() => sanitizeRoomName(roomId), [roomId]);
  const meetingUrl = useMemo(() => buildMeetingUrl(jitsiDomain, jitsiRoomName), [jitsiDomain, jitsiRoomName]);
  const explorerBase = process.env.NEXT_PUBLIC_AMOY_EXPLORER_URL ?? "https://amoy.polygonscan.com";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiApi | null>(null);

  const [joined, setJoined] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [status, setStatus] = useState("Loading secure Jitsi verification room...");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("");
  const [hadRemoteParticipant, setHadRemoteParticipant] = useState(false);
  const [linkedListing, setLinkedListing] = useState<Listing | null>(null);
  const [saveStatus, setSaveStatus] = useState("Finish the verification call, then save the proof to blockchain.");
  const [isSaving, setIsSaving] = useState(false);
  const [savedTxHash, setSavedTxHash] = useState("");

  const totalParticipants = joined ? remoteParticipants + 1 : remoteParticipants;
  const roomState = getVerificationRoomStatus(joined, remoteParticipants);
  const canSaveVerification = Boolean(linkedListing?.onChainBatchId && hadRemoteParticipant && !savedTxHash && !isSaving);
  const canSaveDemoVerification = Boolean(linkedListing?.onChainBatchId && !savedTxHash && !isSaving);
  const referenceLabel = recordingLink ? "Jitsi recording link" : "Jitsi room URL";

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadLinkedListing() {
      try {
        const response = await fetch("/api/listings", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const listings = (await response.json()) as Listing[];
        const matchedListing = listings.find((item) => (item.liveRoomId ?? `room-${item.id}`) === roomId) ?? null;

        if (!ignore) {
          setLinkedListing(matchedListing);
          if (!matchedListing) {
            setSaveStatus("This room is not linked to an on-chain listing yet.");
          } else if (!matchedListing.onChainBatchId) {
            setSaveStatus("This room is linked to a local-only listing, so verification cannot be saved on-chain yet.");
          } else {
            setSaveStatus(
              "You can save the live verification after both users join, or use Demo Verify for a judge-friendly one-person demo."
            );
          }
        }
      } catch {
        if (!ignore) {
          setSaveStatus("The room opened, but the listing details could not be loaded.");
        }
      }
    }

    void loadLinkedListing();

    return () => {
      ignore = true;
    };
  }, [roomId]);

  useEffect(() => {
    let disposed = false;

    async function bootJitsi() {
      try {
        setErrorText("");
        setStatus("Loading secure Jitsi verification room...");
        await loadJitsiScript(jitsiDomain);

        if (disposed || !containerRef.current) {
          return;
        }

        const ExternalApi = (window as WindowWithJitsi).JitsiMeetExternalAPI;
        if (!ExternalApi) {
          throw new Error("Jitsi Meet could not be loaded in this browser.");
        }

        containerRef.current.innerHTML = "";
        const api = new ExternalApi(jitsiDomain, {
          roomName: jitsiRoomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          lang: "en",
          userInfo: {
            displayName: "Mahakrishi Participant"
          },
          onload: () => {
            setStatus("Room loaded. Allow camera and microphone if your browser asks, then start the verification call.");
          },
          configOverwrite: {
            disableDeepLinking: true,
            enableWelcomePage: false,
            prejoinConfig: {
              enabled: false
            },
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            toolbarButtons: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "participants-pane",
              "tileview",
              "settings",
              "hangup",
              "videoquality"
            ]
          },
          interfaceConfigOverwrite: {
            TILE_VIEW_MAX_COLUMNS: 2
          }
        });

        apiRef.current = api;

        api.addListener("videoConferenceJoined", () => {
          setJoined(true);
          setErrorText("");
          setStatus("You joined the verification room. Ask the other participant to open the same invite link.");
        });

        api.addListener("videoConferenceLeft", () => {
          setJoined(false);
          setRemoteParticipants(0);
          setStatus("Meeting ended. Save the verification to blockchain if the inspection is complete.");
        });

        api.addListener("readyToClose", () => {
          setJoined(false);
          setStatus("Jitsi closed the call window. Save the verification to blockchain if the inspection is complete.");
        });

        api.addListener("participantJoined", () => {
          setRemoteParticipants((current) => current + 1);
          setHadRemoteParticipant(true);
          setErrorText("");
          setStatus("Both participants are in the verification room now.");
        });

        api.addListener("participantLeft", () => {
          setRemoteParticipants((current) => Math.max(0, current - 1));
          setStatus("A participant left the room. Keep the link ready in case they need to rejoin.");
        });

        api.addListener("audioMuteStatusChanged", (payload) => {
          setMuted(getEventFlag(payload, "muted"));
        });

        api.addListener("videoMuteStatusChanged", (payload) => {
          setCameraOn(!getEventFlag(payload, "muted"));
        });

        api.addListener("recordingStatusChanged", (payload) => {
          if (payload && typeof payload === "object") {
            const isOn = Boolean("on" in payload ? payload.on : false);
            setRecordingStatus(isOn ? "Recording is active inside Jitsi." : "Recording is currently off.");
          }
        });

        api.addListener("recordingLinkAvailable", (payload) => {
          const link = getEventText(payload, "link");
          if (link) {
            setRecordingLink(link);
            setRecordingStatus("Recording link is available and will be used as the verification reference.");
          }
        });

        api.addListener("cameraError", (payload) => {
          const message = getErrorText(payload) || "Jitsi could not access the camera.";
          setErrorText(message);
          setStatus(message);
        });

        api.addListener("micError", (payload) => {
          const message = getErrorText(payload) || "Jitsi could not access the microphone.";
          setErrorText(message);
          setStatus(message);
        });

        api.addListener("errorOccurred", (payload) => {
          const message = getErrorText(payload);
          if (isFatalJitsiError(payload)) {
            const fatalMessage = message || "Jitsi could not finish preparing the room.";
            setErrorText(fatalMessage);
            setStatus(fatalMessage);
            return;
          }

          if (message) {
            setStatus(`Jitsi note: ${message}`);
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Jitsi Meet could not be started.";
        setErrorText(message);
        setStatus(message);
      }
    }

    void bootJitsi();

    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [jitsiDomain, jitsiRoomName]);

  async function copyInviteLink() {
    if (!meetingUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorText("The invite link could not be copied from this browser.");
    }
  }

  function toggleMute() {
    apiRef.current?.executeCommand("toggleAudio");
  }

  function toggleCamera() {
    apiRef.current?.executeCommand("toggleVideo");
  }

  function openChat() {
    apiRef.current?.executeCommand("toggleChat");
  }

  function shareScreen() {
    apiRef.current?.executeCommand("toggleShareScreen");
  }

  function hangup() {
    apiRef.current?.executeCommand("hangup");
  }

  async function saveVerificationOnChain(mode: "live" | "demo" = "live") {
    if (!linkedListing?.onChainBatchId || isSaving || savedTxHash) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(
      mode === "demo"
        ? "Saving demo verification to Polygon Amoy..."
        : "Saving Jitsi verification to Polygon Amoy..."
    );

    const verificationPayload = {
      roomId,
      listingId: linkedListing.id,
      onChainBatchId: linkedListing.onChainBatchId,
      verificationReference: recordingLink || meetingUrl,
      expertResult:
        mode === "demo"
          ? `Demo verification approved for ${linkedListing.crop} in the Mahakrishi showcase room.`
          : `Jitsi Meet verification completed for ${linkedListing.crop}.`,
      aiQualityScore: getQualityScore(linkedListing)
    };

    try {
      if (mode === "demo") {
        setSaveStatus("Opening MetaMask for demo verification on Polygon Amoy...");
        const [walletAddress, adminAddress] = await Promise.all([getWalletAddress(), getVerificationTrustAdminAddress()]);

        if (walletAddress.toLowerCase() !== adminAddress.toLowerCase()) {
          setSaveStatus(`Switch MetaMask to the verification admin wallet ${adminAddress} to pay for demo verification.`);
          return;
        }

        const walletResult = await addVerificationWithWallet({
          batchId: linkedListing.onChainBatchId,
          videoHash: verificationPayload.verificationReference,
          expertResult: verificationPayload.expertResult,
          aiQualityScore: verificationPayload.aiQualityScore
        });

        setSavedTxHash(walletResult.transactionHash);
        setSaveStatus("Polygon Amoy confirmed the demo verification. Saving the room proof in Mahakrishi...");

        const persistResponse = await fetch("/api/video/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...verificationPayload,
            txHashOverride: walletResult.transactionHash,
            signerAddressOverride: walletResult.signerAddress
          })
        });
        const persistBody = await persistResponse.json();

        if (!persistResponse.ok) {
          setSaveStatus(
            `Demo verification reached Polygon Amoy, but Mahakrishi could not refresh the room state. ${String(persistBody.error ?? "Please refresh the page.")}`
          );
          return;
        }

        setSaveStatus(`Demo verification saved on-chain for batch #${persistBody.onChainBatchId}.`);
        return;
      }

      const response = await fetch("/api/video/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(verificationPayload)
      });

      const body = await response.json();
      if (response.ok) {
        setSavedTxHash(body.txHash ?? "");
        setSaveStatus(`Verification saved on-chain for batch #${body.onChainBatchId}.`);
        return;
      }

      const errorMessage = String(body.error ?? "");
      if (canFallbackToWalletVerification(errorMessage)) {
        const [walletAddress, adminAddress] = await Promise.all([getWalletAddress(), getVerificationTrustAdminAddress()]);
        if (walletAddress.toLowerCase() !== adminAddress.toLowerCase()) {
          setSaveStatus(`Switch MetaMask to the verification admin wallet ${adminAddress} to pay for on-chain verification.`);
          return;
        }

        const walletResult = await addVerificationWithWallet({
          batchId: linkedListing.onChainBatchId,
          videoHash: verificationPayload.verificationReference,
          expertResult: verificationPayload.expertResult,
          aiQualityScore: verificationPayload.aiQualityScore
        });
        setSavedTxHash(walletResult.transactionHash);

        const persistResponse = await fetch("/api/video/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...verificationPayload,
            txHashOverride: walletResult.transactionHash,
            signerAddressOverride: walletResult.signerAddress
          })
        });
        const persistBody = await persistResponse.json();

        if (!persistResponse.ok) {
          setSaveStatus(
            `Verification reached Polygon Amoy, but Mahakrishi could not refresh the room state. ${String(persistBody.error ?? "Please refresh the page.")}`
          );
          return;
        }

        setSaveStatus(`Verification saved on-chain for batch #${persistBody.onChainBatchId}.`);
        return;
      }

      setSaveStatus(errorMessage || "Verification could not be saved on-chain.");
    } catch (error) {
      if (isUserRejectedWalletAction(error)) {
        setSaveStatus("MetaMask confirmation was cancelled, so the verification was not saved on-chain.");
      } else {
        setSaveStatus(error instanceof Error ? error.message : "Verification could not be saved on-chain.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-voice="go home open home page">
            <BrandMark className="nav-logo" background="var(--brand-primary)" color="var(--brand-secondary)" />
            <div>
              <div className="nav-title">Video Verification</div>
              <div className="nav-subtitle">Jitsi Meet</div>
            </div>
          </Link>

          <div className={`nav-actions ${styles.headerActions}`}>
            <a
              href={meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              data-voice="open jitsi room open full room open video in new tab"
            >
              <ExternalLink size={16} />
              Open Full Room
            </a>
            <Link href="/buyer" className="btn btn-secondary btn-sm" data-voice="back to marketplace open buyer page">
              <ArrowLeft size={16} />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.hero}
        >
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.eyebrow}>Live Verification Room</span>
              <h1 className={styles.heroTitle}>Verify Produce Before Escrow Release</h1>
              <p className={styles.heroText}>
                The live meeting runs directly in the browser with Jitsi Meet, so both users can join the same room,
                talk over video, share screens, and then save the verification proof to Polygon Amoy.
              </p>

              <div className={styles.heroBadges}>
                <span className="badge" style={{ background: "rgba(255,255,255,0.16)", color: "white" }}>
                  <Users size={14} /> Room: {roomId}
                </span>
                <span className="badge" style={{ background: joined ? "var(--accent-success)" : "rgba(255,255,255,0.16)", color: "white" }}>
                  {joined ? "Joined" : "Waiting"}
                </span>
                <span className="badge" style={{ background: "rgba(255,255,255,0.16)", color: "white" }}>
                  {totalParticipants} Participant{totalParticipants !== 1 ? "s" : ""}
                </span>
                {linkedListing?.onChainBatchId ? (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.16)", color: "white" }}>
                    Batch #{linkedListing.onChainBatchId}
                  </span>
                ) : null}
              </div>
            </div>

            <div className={styles.heroPanel}>
              <div className={styles.heroPanelTitle}>Room Readiness</div>
              <div className={styles.heroPanelList}>
                <div className={styles.heroPanelRow}>
                  <span>Meeting engine</span>
                  <strong>Jitsi IFrame API</strong>
                </div>
                <div className={styles.heroPanelRow}>
                  <span>Join mode</span>
                  <strong>Browser only</strong>
                </div>
                <div className={styles.heroPanelRow}>
                  <span>Current status</span>
                  <strong>{roomState}</strong>
                </div>
                <div className={styles.heroPanelRow}>
                  <span>Proof target</span>
                  <strong>{linkedListing?.onChainBatchId ? "Polygon Amoy" : "Waiting for linked batch"}</strong>
                </div>
              </div>
              <p className={styles.heroPanelNote}>
                No extra app install is required. If the embed looks blocked in your browser, open the room in a full
                tab and continue the same verification flow there.
              </p>
            </div>
          </div>
        </motion.section>

        <section className={styles.contentGrid}>
          <div className={`card card-lg ${styles.callCard}`}>
            <div className={styles.callHeader}>
              <div>
                <h3>Jitsi Verification Call</h3>
                <p className={styles.callSubtitle}>{status}</p>
              </div>
              <span className={`badge ${joined && hadRemoteParticipant ? "badge-success" : "badge-warning"}`}>
                {roomState}
              </span>
            </div>

            {errorText ? (
              <div className={styles.errorBanner}>
                <AlertCircle size={20} color="var(--accent-warning)" />
                <div>
                  <div className={styles.bannerTitle}>Jitsi Issue</div>
                  <p className={styles.bannerText}>{errorText}</p>
                </div>
              </div>
            ) : (
              <div className={styles.noticeBanner}>
                Allow camera and microphone access if your browser asks, then ask the second participant to open the same
                Mahakrishi room link.
              </div>
            )}

            <div className={styles.stageShell}>
              <div className={styles.stageHeader}>
                <div>
                  <div className={styles.stageLabel}>Verification Room</div>
                  <div className={styles.stageTitle}>{jitsiRoomName}</div>
                </div>
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  data-voice="open full room open jitsi open video room"
                >
                  <ExternalLink size={16} />
                  Open in Jitsi
                </a>
              </div>

              <div ref={containerRef} className={styles.meetingFrame} />
            </div>

            <div className={styles.controlDock}>
              <button
                className={`btn ${muted ? "btn-primary" : "btn-secondary"}`}
                onClick={toggleMute}
                disabled={!joined}
                data-voice={muted ? "unmute turn microphone on" : "mute turn microphone off"}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
                {muted ? "Unmute" : "Mute"}
              </button>
              <button
                className={`btn ${cameraOn ? "btn-secondary" : "btn-primary"}`}
                onClick={toggleCamera}
                disabled={!joined}
                data-voice={cameraOn ? "camera off turn camera off stop camera video off" : "camera on turn camera on start camera video on"}
              >
                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                {cameraOn ? "Camera Off" : "Camera On"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={openChat}
                disabled={!joined}
                data-voice="open chat show chat verification chat"
              >
                <MessageSquare size={18} />
                Chat
              </button>
              <button
                className="btn btn-secondary"
                onClick={shareScreen}
                disabled={!joined}
                data-voice="share screen start screen share present screen"
              >
                <MonitorUp size={18} />
                Share Screen
              </button>
              <button
                className="btn btn-secondary"
                onClick={hangup}
                disabled={!joined}
                data-testid="end-call-btn"
                data-voice="end call hang up leave room"
              >
                <PhoneOff size={18} />
                End Call
              </button>
            </div>

            <p className={styles.supportText}>
              The dock above is optimized for quick actions and voice commands. All advanced controls still remain
              inside the embedded Jitsi room itself.
            </p>
          </div>

          <aside className={styles.sidebar}>
            <div className={`card card-lg ${styles.sideCard}`}>
              <h3 style={{ marginBottom: "var(--space-md)" }}>Invite Participant</h3>
              <p className={styles.sideText}>
                Share this direct Jitsi room link so the second user can join the same verification call immediately.
              </p>

              <a href={meetingUrl} target="_blank" rel="noreferrer" className={styles.linkBox}>
                {meetingUrl || "Loading..."}
              </a>

              <p className={styles.sideHint}>
                This is a real join link, so it opens the same Jitsi room in a clean browser tab.
              </p>

              <div className={styles.sideActions}>
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
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  data-voice="open full room open direct jitsi room"
                >
                  <ExternalLink size={18} />
                  Open Join Link
                </a>
              </div>
            </div>

            <div className={`card card-lg ${styles.sideCard}`}>
              <h3 style={{ marginBottom: "var(--space-md)" }}>Verification Save</h3>
              <div className={styles.detailList}>
                <div className={styles.detailRow}>
                  <span>Linked crop</span>
                  <strong>{linkedListing?.crop ?? "Not linked"}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Blockchain batch</span>
                  <strong>{linkedListing?.onChainBatchId ? `#${linkedListing.onChainBatchId}` : "Unavailable"}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Reference source</span>
                  <strong>{referenceLabel}</strong>
                </div>
              </div>

              {recordingStatus ? <p className={styles.sideHint}>{recordingStatus}</p> : null}

              <button
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "var(--space-md)" }}
                onClick={() => void saveVerificationOnChain("live")}
                disabled={!canSaveVerification}
                data-voice="save verification save on blockchain complete verification finalize verification"
              >
                {isSaving ? "Saving..." : savedTxHash ? "Saved On-Chain" : "Save Verification On-Chain"}
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: "100%", marginBottom: "var(--space-md)" }}
                onClick={() => void saveVerificationOnChain("demo")}
                disabled={!canSaveDemoVerification}
                data-voice="demo verify demo verification approve demo save demo verification"
              >
                {isSaving ? "Saving..." : savedTxHash ? "Saved On-Chain" : "Demo Verify On-Chain"}
              </button>

              <p className={styles.sideText}>{saveStatus}</p>

              {savedTxHash ? (
                <a
                  href={`${explorerBase}/tx/${savedTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ width: "100%", marginTop: "var(--space-md)" }}
                >
                  <ExternalLink size={18} />
                  View Transaction
                </a>
              ) : null}
            </div>

            <div className={`card card-lg ${styles.sideCard}`}>
              <h3 style={{ marginBottom: "var(--space-lg)" }}>Verification Steps</h3>
              <div className={styles.stepList}>
                {[
                  {
                    title: "Share one room link",
                    desc: "Both users open the same Mahakrishi verification page or the same direct Jitsi room."
                  },
                  {
                    title: "Verify crop live",
                    desc: "Use video, voice, chat, and screen share to confirm quality, quantity, and agreement terms."
                  },
                  {
                    title: "Complete the call",
                    desc: "Finish the discussion once both sides are satisfied with the verification."
                  },
                  {
                    title: "Save proof on-chain",
                    desc: "Store the verification reference on Polygon Amoy for transparency and fair trade."
                  }
                ].map((item, index) => (
                  <div key={item.title} className={styles.stepItem}>
                    <div className={styles.stepNumber}>{index + 1}</div>
                    <div>
                      <div className={styles.stepTitle}>{item.title}</div>
                      <div className={styles.stepDesc}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.helpCard}>
              <Shield size={24} color="var(--brand-primary)" />
              <div>
                <div className={styles.helpTitle}>If the embed looks blocked</div>
                <p className={styles.helpText}>
                  Open the same room in a full Jitsi tab, allow camera and microphone access there, and then return here
                  when you are ready to save the verification to blockchain.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
