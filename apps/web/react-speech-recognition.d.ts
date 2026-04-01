declare module "react-speech-recognition" {
  export type Command = {
    command: string | string[];
    callback?: (...args: any[]) => void;
    isFuzzyMatch?: boolean;
    fuzzyMatchingThreshold?: number;
    bestMatchOnly?: boolean;
    matchInterim?: boolean;
  };

  export type UseSpeechRecognitionResult = {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    browserSupportsContinuousListening: boolean;
  };

  export function useSpeechRecognition(options?: {
    commands?: Command[];
  }): UseSpeechRecognitionResult;

  const SpeechRecognition: {
    startListening: (options?: { continuous?: boolean; language?: string }) => Promise<void> | void;
    stopListening: () => Promise<void> | void;
    abortListening: () => Promise<void> | void;
    applyPolyfill: (ponyfill: unknown) => void;
  };

  export default SpeechRecognition;
}

