"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Volume2, X } from "lucide-react";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  response: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
}

type VoiceCommand = {
  id: string;
  phrases: string[];
  response: string;
  route?: string;
  action?: (rawText: string) => boolean | Promise<boolean>;
};

const VoiceContext = createContext<VoiceContextType | null>(null);

const STOP_WORDS = new Set([
  "please",
  "hey",
  "hi",
  "hello",
  "can",
  "could",
  "would",
  "you",
  "me",
  "for",
  "the",
  "a",
  "an",
  "to",
  "my",
  "is",
  "and",
  "na",
  "just",
  "kindly",
  "bro",
  "sir",
  "page",
  "screen",
  "portal",
  "section",
  "dashboard"
]);

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within VoiceProvider");
  }
  return context;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeStopWords(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word))
    .join(" ");
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const indicator = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }

  return matrix[b.length][a.length];
}

function similarity(a: string, b: string) {
  const x = removeStopWords(a);
  const y = removeStopWords(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.96;

  const xWords = new Set(x.split(" "));
  const yWords = new Set(y.split(" "));
  const intersection = [...xWords].filter((word) => yWords.has(word)).length;
  const union = new Set([...xWords, ...yWords]).size || 1;
  const tokenScore = intersection / union;

  const distance = levenshtein(x, y);
  const charScore = 1 - distance / Math.max(x.length, y.length);

  return tokenScore * 0.6 + Math.max(0, charScore) * 0.4;
}

function getClickableCandidates() {
  const selectors = [
    "a",
    "button",
    "[role='button']",
    "[data-voice]",
    "input[type='submit']",
    "input[type='button']"
  ].join(",");

  return Array.from(document.querySelectorAll<HTMLElement>(selectors))
    .filter((element) => {
      if (element.dataset.testid === "voice-fab") {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        !element.hasAttribute("disabled") &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    })
    .map((element) => {
      const voice = element.getAttribute("data-voice") ?? "";
      const text = normalizeText(
        `${voice} ${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""}`
      );
      return { element, text };
    })
    .filter((item) => item.text);
}

function isElementVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    !element.hasAttribute("disabled") &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function navigateToElement(target: HTMLElement, router: ReturnType<typeof useRouter>) {
  if (target instanceof HTMLAnchorElement && target.href) {
    const targetUrl = new URL(target.href, window.location.origin);
    const nextPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    router.push(nextPath);
    return true;
  }

  target.click();
  return true;
}

function getCallCandidates() {
  const selectors = [
    "a[href*='/call/']",
    "a[data-voice*='call']",
    "button[data-voice*='call']",
    "a[data-voice*='video room']",
    "button[data-voice*='video room']",
    "a[data-voice*='video call']",
    "button[data-voice*='video call']"
  ].join(",");

  return Array.from(document.querySelectorAll<HTMLElement>(selectors))
    .filter((element) => {
      if (element.dataset.testid === "voice-fab" || element.dataset.testid === "end-call-btn") {
        return false;
      }

      return isElementVisible(element);
    })
    .map((element) => {
      const href = element instanceof HTMLAnchorElement ? element.href : "";
      const voice = element.getAttribute("data-voice") ?? "";
      const text = normalizeText(
        `${voice} ${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""} ${href}`
      );

      return { element, href, text };
    })
    .filter((item) => item.text);
}

function openBestCallRoom(rawText: string, router: ReturnType<typeof useRouter>) {
  const cleaned = removeStopWords(rawText);
  const candidates = getCallCandidates();
  let best: { element: HTMLElement; href: string; text: string } | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarity(cleaned, candidate.text);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (best && bestScore >= 0.4) {
    return navigateToElement(best.element, router);
  }

  const firstCallLink = candidates.find((candidate) => candidate.href.includes("/call/"));
  if (firstCallLink) {
    return navigateToElement(firstCallLink.element, router);
  }

  router.push("/call/demo");
  return true;
}

function clickBestMatch(rawText: string) {
  const cleaned = removeStopWords(rawText);
  const actionText = cleaned
    .replace(/^(open|go|show|click|visit|move|take|navigate|select|run|start|continue|switch|choose|lock|copy|preview|join|use|review|connect)\s+/, "")
    .replace(/^(to|as)\s+/, "")
    .trim();

  const candidates = getClickableCandidates();
  let best: { element: HTMLElement; text: string } | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarity(actionText || cleaned, candidate.text);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (best && bestScore >= 0.52) {
    best.element.click();
    return true;
  }

  return false;
}

function setElementValue(target: HTMLInputElement | HTMLTextAreaElement, nextValue: string) {
  const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (setter) {
    setter.call(target, nextValue);
  } else {
    target.value = nextValue;
  }

  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

function fillBestInput(rawText: string) {
  const cleaned = normalizeText(rawText);
  const match = cleaned.match(/(?:search|find|look for)\s+(.+)/);
  if (!match) return false;

  const query = match[1]?.trim();
  if (!query) return false;

  const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));
  const target = inputs.find((input) => {
    if (input instanceof HTMLInputElement && ["button", "submit", "checkbox", "radio", "hidden"].includes(input.type)) {
      return false;
    }

    const meta = normalizeText(
      `${input.placeholder || ""} ${input.name || ""} ${input.id || ""} ${input.getAttribute("aria-label") || ""}`
    );
    return meta.includes("search") || meta.includes("crop");
  });

  if (!target) return false;

  setElementValue(target, query);
  target.focus();
  return true;
}

function chooseSelectOption(rawText: string) {
  const cleaned = normalizeText(rawText).replace(/^(select|choose|filter)\s+/, "").trim();
  if (!cleaned) return false;

  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>("select"));
  if (!selects.length) return false;

  for (const select of selects) {
    let bestIndex = -1;
    let bestScore = 0;

    Array.from(select.options).forEach((option, index) => {
      const score = similarity(cleaned, option.text);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0 && bestScore >= 0.72) {
      select.selectedIndex = bestIndex;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }

  return false;
}

function getCommands(router: ReturnType<typeof useRouter>): VoiceCommand[] {
  return [
    {
      id: "greet",
      phrases: ["hello", "hi", "hey assistant", "hello krishi voice"],
      response: "Hello. I can navigate pages, click buttons, search fields, and choose filters for you."
    },
    {
      id: "home",
      phrases: ["go home", "open home", "open landing page", "take me home"],
      route: "/",
      response: "Opening the home page."
    },
    {
      id: "login",
      phrases: ["open login page", "go to login", "open role login", "open sign in"],
      route: "/login",
      response: "Opening the login page."
    },
    {
      id: "farmer",
      phrases: ["open farmer page", "go to farmer", "open farmer dashboard", "farmer login", "login as farmer", "open seller portal"],
      route: "/farmer",
      response: "Opening the farmer page."
    },
    {
      id: "buyer",
      phrases: ["open buyer page", "go to buyer", "open marketplace", "buyer market", "open buyer marketplace", "login as buyer"],
      route: "/buyer",
      response: "Opening the buyer marketplace."
    },
    {
      id: "consumer",
      phrases: ["open consumer page", "go to consumer", "open consumer portal", "open trace verify"],
      route: "/consumer",
      response: "Opening the consumer page."
    },
    {
      id: "admin",
      phrases: ["open admin page", "go to admin", "open admin dashboard", "admin control center"],
      route: "/admin",
      response: "Opening the admin page."
    },
    {
      id: "create-listing",
      phrases: ["create listing", "register crop", "sell crop", "add crop listing", "open seller form"],
      response: "Opening the crop listing flow.",
      action: async (rawText) => {
        if (clickBestMatch(rawText)) {
          return true;
        }

        router.push("/farmer?section=sell");
        return true;
      }
    },
    {
      id: "inventory",
      phrases: ["check inventory", "my inventory", "open inventory", "show listings"],
      response: "Opening inventory.",
      action: async (rawText) => {
        if (clickBestMatch(rawText)) {
          return true;
        }

        router.push("/farmer?section=inventory");
        return true;
      }
    },
    {
      id: "wallet",
      phrases: ["connect wallet", "open wallet", "wallet section", "open payment wallet"],
      response: "Opening wallet controls.",
      action: async (rawText) => {
        if (clickBestMatch(rawText)) {
          return true;
        }

        router.push("/farmer?section=wallet");
        return true;
      }
    },
    {
      id: "call-buyer",
      phrases: [
        "call buyer",
        "connect buyer",
        "open buyer call",
        "start buyer call",
        "open call page",
        "video call"
      ],
      response: "Opening the video call room.",
      action: async (rawText) => {
        return openBestCallRoom(rawText, router);
      }
    },
    {
      id: "click",
      phrases: [
        "open trace page",
        "open video room",
        "camera ons",
        "lock escrow",
        "run ai analysis",
        "switch role",
        "continue as farmer",
        "continue as buyer",
        "continue as admin",
        "continue as consumer",
        "review alert",
        "verify batch",
        "open camera to scan",
        "preview camera",
        "join room",
        "copy invite link",
        "mute",
        "unmute",
        "start camera",
        "camera on",
        "camera off",
        "end call",
        "view details"
      ],
      response: "Running the closest action on this page.",
      action: async (rawText) => clickBestMatch(rawText)
    },
    {
      id: "help",
      phrases: ["help", "what can you do", "voice help", "show commands"],
      response:
        "You can say open farmer page, open buyer page, create listing, search tomato, lock escrow, open trace page, or switch role. Extra words and small mistakes are okay."
    }
  ];
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const processCommand = useCallback(
    async (rawText: string) => {
      const cleaned = normalizeText(rawText);
      if (!cleaned) return;

      setTranscript(rawText.trim());
      setShowPanel(true);

      if (fillBestInput(cleaned)) {
        const query = cleaned.match(/(?:search|find|look for)\s+(.+)/)?.[1]?.trim() ?? "that query";
        const reply = `Searching for ${query}.`;
        setResponse(reply);
        speak(reply);
        return;
      }

      if (chooseSelectOption(cleaned)) {
        const reply = "Selecting the closest option.";
        setResponse(reply);
        speak(reply);
        return;
      }

      const commands = getCommands(router);
      let bestCommand: VoiceCommand | null = null;
      let bestPhrase = "";
      let bestScore = 0;

      for (const command of commands) {
        for (const phrase of command.phrases) {
          const score = similarity(cleaned, phrase);
          if (score > bestScore) {
            bestScore = score;
            bestCommand = command;
            bestPhrase = phrase;
          }
        }
      }

      if (bestCommand && bestScore >= 0.58) {
        setResponse(bestCommand.response);
        speak(bestCommand.response);

        if (bestCommand.route) {
          router.push(bestCommand.route);
          return;
        }

        if (bestCommand.action) {
          const worked = await bestCommand.action(cleaned);
          if (!worked) {
            const fallback = "I understood the command, but I could not find that control on this page.";
            setResponse(fallback);
            speak(fallback);
          }
          return;
        }

        return;
      }

      if (clickBestMatch(cleaned)) {
        const reply = "Running the closest action on this page.";
        setResponse(`${reply} I matched it directly from the current screen.`);
        speak(reply);
        return;
      }

      const fallback = `I heard "${rawText}" but could not confidently match it. Try saying open farmer page, open buyer page, create listing, or help.`;
      setResponse(`${fallback} Best guess was "${bestPhrase || "none"}" with score ${bestScore.toFixed(2)}.`);
      speak(fallback);
    },
    [router, speak]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionCtor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    };
    const RecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new RecognitionCtor() as BrowserSpeechRecognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let heard = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        heard += event.results[i][0].transcript;
      }

      setTranscript(heard.trim());
      const current = event.results[event.results.length - 1];
      if (current?.isFinal) {
        void processCommand(heard.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [processCommand]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      const message = "Voice commands are not supported in this browser.";
      setShowPanel(true);
      setResponse(message);
      speak(message);
      return;
    }

    setTranscript("");
    setResponse("");
    setShowPanel(true);
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      recognition.stop();
      try {
        recognition.start();
      } catch {
        setIsListening(false);
      }
    }
  }, [speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return (
    <VoiceContext.Provider value={{ isListening, transcript, response, startListening, stopListening, speak }}>
      {children}

      <button
        data-testid="voice-fab"
        className={`voice-fab ${isListening ? "listening" : ""}`}
        onClick={isListening ? stopListening : startListening}
        aria-label={isListening ? "Stop listening" : "Start voice command"}
      >
        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>

      {showPanel ? (
        <div className="voice-response fade-in" data-testid="voice-panel">
          <div className="voice-response-header">
            <div className="voice-status">
              {isListening ? <span className="voice-status-dot" /> : null}
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

          {transcript ? (
            <div className="voice-transcript">
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>You said:</span>
              <p style={{ margin: "4px 0 0", fontWeight: 500 }}>{transcript}</p>
            </div>
          ) : null}

          {response ? (
            <div
              style={{
                padding: "12px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-md)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Volume2 size={16} style={{ color: "var(--brand-primary)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Response:</span>
              </div>
              <p style={{ margin: 0, color: "var(--text-primary)" }}>{response}</p>
            </div>
          ) : null}

          <div className="voice-commands">
            <span className="voice-command-tag">open farmer page</span>
            <span className="voice-command-tag">create listing</span>
            <span className="voice-command-tag">search tomato</span>
            <span className="voice-command-tag">lock escrow</span>
          </div>
        </div>
      ) : null}
    </VoiceContext.Provider>
  );
}
