export type InjectedEthereumProvider = {
  isMetaMask?: boolean;
  providers?: InjectedEthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: InjectedEthereumProvider;
  }
}

export function getInjectedProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const ethereum = window.ethereum;
  if (!ethereum) {
    return undefined;
  }

  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    return ethereum.providers.find((provider) => provider.isMetaMask) ?? ethereum.providers[0];
  }

  return ethereum;
}

export async function waitForInjectedProvider(timeoutMs = 2200) {
  const existing = getInjectedProvider();
  if (existing) {
    return existing;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  return new Promise<InjectedEthereumProvider | undefined>((resolve) => {
    let done = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = (provider?: InjectedEthereumProvider) => {
      if (done) {
        return;
      }

      done = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener("ethereum#initialized", handleInitialized as EventListener);
      resolve(provider);
    };

    const handleInitialized = () => {
      finish(getInjectedProvider());
    };

    window.addEventListener("ethereum#initialized", handleInitialized as EventListener, { once: true });

    intervalId = setInterval(() => {
      const provider = getInjectedProvider();
      if (provider) {
        finish(provider);
      }
    }, 350);

    timeoutId = setTimeout(() => {
      finish(getInjectedProvider());
    }, timeoutMs);
  });
}

export function getWalletErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 4001) {
    return "The wallet request was cancelled. Please try again and approve it in MetaMask.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Wallet connection failed. Please try again.";
}
