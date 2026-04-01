"use client";

import { useEffect, useRef, useState } from "react";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  }
}

export function FarmerVoiceAssistant() {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [message, setMessage] = useState("Tap the microphone and try: sell tomato 200 kilos.");
  const [language, setLanguage] = useState("en-IN");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setSupported(false);
      return;
    }

    setSupported(true);
    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      setTranscript(nextTranscript);
      routeCommand(nextTranscript.toLowerCase());
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language]);

  function routeCommand(text: string) {
    if (text.startsWith("sell ")) {
      setMessage(`Voice captured a sell intent for "${text}". Open the form to confirm quantity and price.`);
      return;
    }

    if (text.includes("check price")) {
      setMessage("Voice command detected. Pulling fair-price guidance for the requested crop.");
      return;
    }

    if (text.includes("my orders")) {
      setMessage("Routing farmer to current buyer negotiations and escrow states.");
      return;
    }

    if (text.includes("call buyer")) {
      setMessage("Live verification room is ready. Use the call link below.");
      return;
    }

    if (text.includes("analyze crop")) {
      setMessage("AI analysis requested. Upload image or trigger the batch analysis button.");
    }
  }

  function startListening() {
    recognitionRef.current?.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function resetTranscript() {
    setTranscript("");
    setMessage("Voice panel reset. Try another command.");
  }

  if (!supported) {
    return (
      <section className="card">
        <p className="kicker">Voice</p>
        <h3>Speech recognition unavailable</h3>
        <p>This browser does not expose the Web Speech API, so the farmer flow falls back to manual forms.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="panel-title-row">
        <div>
          <p className="kicker">Voice-first farmer flow</p>
          <h3>Hands-free crop registration</h3>
        </div>
        <span className="status-pill status-success">{listening ? "Listening" : "Mic ready"}</span>
      </div>
      <div className="toolbar">
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="en-IN">English</option>
          <option value="hi-IN">Hindi</option>
          <option value="ta-IN">Tamil</option>
        </select>
        <button className="button" onClick={startListening}>
          {listening ? "Listening..." : "Start Voice"}
        </button>
        <button className="ghost-button" onClick={stopListening}>
          Stop
        </button>
          <button className="ghost-button" onClick={resetTranscript}>
            Reset
          </button>
        </div>

      <div className="tag-row">
        <span className="tag">sell tomato 200 kilos</span>
        <span className="tag">check price</span>
        <span className="tag">call buyer</span>
        <span className="tag">analyze crop</span>
      </div>

      <div className="notice-card">
        <strong>Assistant status</strong>
        <p>{message}</p>
      </div>

      <div className="panel transcript-panel">
        <p className="kicker">Transcript</p>
        <p>{transcript || "No speech captured yet."}</p>
      </div>
    </section>
  );
}
