"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic, MicOff, X, Volume2 } from "lucide-react";

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  response: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within VoiceProvider");
  }
  return context;
}

const VOICE_COMMANDS: Record<string, { action: string; route?: string; response: string }> = {
  "hello": { action: "greet", response: "Hello! Welcome to KrishiVoice Chain. How can I help you today?" },
  "hi": { action: "greet", response: "Hi there! Ready to help you with your farming needs." },
  "go to farmer": { action: "navigate", route: "/farmer", response: "Taking you to the Farmer Dashboard." },
  "go to buyer": { action: "navigate", route: "/buyer", response: "Opening the Buyer Marketplace." },
  "go to buyer market": { action: "navigate", route: "/buyer", response: "Opening the Buyer Marketplace." },
  "open marketplace": { action: "navigate", route: "/buyer", response: "Opening the Buyer Marketplace." },
  "go to admin": { action: "navigate", route: "/admin", response: "Opening Admin Panel." },
  "go to consumer": { action: "navigate", route: "/consumer", response: "Opening Consumer Portal." },
  "go home": { action: "navigate", route: "/", response: "Taking you to the home page." },
  "sell crop": { action: "navigate", route: "/farmer?section=sell", response: "Opening crop registration. Tell me about your harvest." },
  "register crop": { action: "navigate", route: "/farmer?section=sell", response: "Opening crop registration form." },
  "create listing": { action: "navigate", route: "/farmer?section=sell", response: "Let's create a new crop listing." },
  "check inventory": { action: "navigate", route: "/farmer?section=inventory", response: "Opening your inventory." },
  "my inventory": { action: "navigate", route: "/farmer?section=inventory", response: "Here's your inventory." },
  "connect wallet": { action: "navigate", route: "/farmer?section=wallet", response: "Opening wallet connection." },
  "open wallet": { action: "navigate", route: "/farmer?section=wallet", response: "Opening your wallet." },
  "check price": { action: "price", response: "Based on current market trends, tomatoes are selling at 35 rupees per kg, rice at 42 rupees per kg." },
  "what's the price": { action: "price", response: "Current market prices: Tomato 35/kg, Rice 42/kg, Wheat 28/kg, Onion 25/kg." },
  "call expert": { action: "expert", response: "Connecting you to an agricultural expert. Please hold." },
  "help": { action: "help", response: "You can say: sell crop, check price, go to buyer market, check inventory, or connect wallet." },
  "what can you do": { action: "help", response: "I can help you register crops, check prices, navigate the app, and connect with buyers. Try saying 'sell tomatoes' or 'go to marketplace'." },
};

export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-IN";

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase().trim();
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          processCommand(transcriptText);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const processCommand = useCallback((text: string) => {
    // Find matching command
    let matchedCommand = null;
    let matchedKey = "";
    
    for (const key of Object.keys(VOICE_COMMANDS)) {
      if (text.includes(key)) {
        if (!matchedKey || key.length > matchedKey.length) {
          matchedCommand = VOICE_COMMANDS[key];
          matchedKey = key;
        }
      }
    }

    if (matchedCommand) {
      setResponse(matchedCommand.response);
      speak(matchedCommand.response);
      
      if (matchedCommand.route) {
        setTimeout(() => {
          router.push(matchedCommand.route!);
        }, 1000);
      }
    } else {
      // Default response for unrecognized commands
      const defaultResponse = `I heard "${text}". Try saying "help" to see available commands.`;
      setResponse(defaultResponse);
      speak(defaultResponse);
    }
  }, [router, speak]);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript("");
      setResponse("");
      setShowPanel(true);
      setIsListening(true);
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  // Don't show FAB on login page
  const showFAB = pathname !== "/";

  return (
    <VoiceContext.Provider value={{ isListening, transcript, response, startListening, stopListening, speak }}>
      {children}
      
      {/* Voice FAB */}
      {showFAB && (
        <button
          data-testid="voice-fab"
          className={`voice-fab ${isListening ? "listening" : ""}`}
          onClick={isListening ? stopListening : startListening}
          aria-label={isListening ? "Stop listening" : "Start voice command"}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
      )}

      {/* Voice Response Panel */}
      {showPanel && showFAB && (
        <div className="voice-response fade-in" data-testid="voice-panel">
          <div className="voice-response-header">
            <div className="voice-status">
              {isListening && <span className="voice-status-dot" />}
              <span>{isListening ? "Listening..." : "Voice Assistant"}</span>
            </div>
            <button 
              className="btn-ghost btn-icon"
              onClick={() => setShowPanel(false)}
              aria-label="Close voice panel"
            >
              <X size={18} />
            </button>
          </div>

          {transcript && (
            <div className="voice-transcript">
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>You said:</span>
              <p style={{ margin: "4px 0 0", fontWeight: 500 }}>{transcript}</p>
            </div>
          )}

          {response && (
            <div style={{ 
              padding: "12px", 
              background: "var(--bg-secondary)", 
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-md)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Volume2 size={16} style={{ color: "var(--brand-primary)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Response:</span>
              </div>
              <p style={{ margin: 0, color: "var(--text-primary)" }}>{response}</p>
            </div>
          )}

          <div className="voice-commands">
            <span className="voice-command-tag">go to farmer</span>
            <span className="voice-command-tag">sell crop</span>
            <span className="voice-command-tag">check price</span>
            <span className="voice-command-tag">open marketplace</span>
          </div>
        </div>
      )}
    </VoiceContext.Provider>
  );
}
