"use client";

import Link from "next/link";
import { BrowserProvider, formatEther } from "ethers";
import { useEffect, useState } from "react";
import { getInjectedProvider, getWalletErrorMessage, waitForInjectedProvider } from "@/lib/wallet/provider";

type WalletState = {
  hasProvider: boolean | null;
  account: string;
  balance: string;
  chainId: string;
  statusText: string;
};

export function WalletPanel({ compact = false }: { compact?: boolean }) {
  const [wallet, setWallet] = useState<WalletState>({
    hasProvider: null,
    account: "",
    balance: "",
    chainId: "",
    statusText: "Checking for MetaMask..."
  });
  const [connecting, setConnecting] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;

    async function refresh(providerOverride?: ReturnType<typeof getInjectedProvider>) {
      const providerSource = providerOverride ?? getInjectedProvider();

      if (!providerSource) {
        if (!active) {
          return;
        }

        setWallet({
          hasProvider: false,
          account: "",
          balance: "",
          chainId: "",
          statusText: "MetaMask was not detected in this browser yet."
        });
        return;
      }

      const provider = new BrowserProvider(providerSource as never);
      const accounts = (await providerSource.request({
        method: "eth_accounts"
      })) as string[];
      const network = await provider.getNetwork();

      if (!active) {
        return;
      }

      if (accounts[0]) {
        const balance = await provider.getBalance(accounts[0]);
        setWallet({
          hasProvider: true,
          account: accounts[0],
          balance: `${Number(formatEther(balance)).toFixed(4)} ETH`,
          chainId: network.chainId.toString(),
          statusText: "Wallet connected and ready for checkout."
        });
      } else {
        setWallet({
          hasProvider: true,
          account: "",
          balance: "",
          chainId: network.chainId.toString(),
          statusText: "MetaMask detected. Connect once to use wallet-backed actions."
        });
      }
    }

    async function detectAndRefresh() {
      const provider = await waitForInjectedProvider();
      await refresh(provider);
    }

    function handleChange() {
      void refresh();
    }

    void detectAndRefresh();

    const provider = getInjectedProvider();
    provider?.on?.("accountsChanged", handleChange);
    provider?.on?.("chainChanged", handleChange);

    return () => {
      active = false;
      provider?.removeListener?.("accountsChanged", handleChange);
      provider?.removeListener?.("chainChanged", handleChange);
    };
  }, []);

  async function retryDetection() {
    setErrorText("");
    setWallet((current) => ({
      ...current,
      hasProvider: null,
      statusText: "Checking for MetaMask again..."
    }));

    const provider = await waitForInjectedProvider(2600);

    if (!provider) {
      setWallet({
        hasProvider: false,
        account: "",
        balance: "",
        chainId: "",
        statusText: "MetaMask is still not available. Use Chrome, Edge, or Brave with the extension enabled."
      });
      return;
    }

    const browserProvider = new BrowserProvider(provider as never);
    const network = await browserProvider.getNetwork();

    setWallet({
      hasProvider: true,
      account: "",
      balance: "",
      chainId: network.chainId.toString(),
      statusText: "MetaMask detected. Connect to continue."
    });
  }

  async function connectWallet() {
    setErrorText("");
    const provider = await waitForInjectedProvider(1200);

    if (!provider) {
      setWallet((current) => ({
        ...current,
        hasProvider: false,
        statusText: "MetaMask is not available in this browser."
      }));
      return;
    }

    setConnecting(true);
    try {
      await provider.request({ method: "eth_requestAccounts" });

      const browserProvider = new BrowserProvider(provider as never);
      const network = await browserProvider.getNetwork();
      const accounts = (await provider.request({ method: "eth_accounts" })) as string[];

      if (accounts[0]) {
        const balance = await browserProvider.getBalance(accounts[0]);
        setWallet({
          hasProvider: true,
          account: accounts[0],
          balance: `${Number(formatEther(balance)).toFixed(4)} ETH`,
          chainId: network.chainId.toString(),
          statusText: "Wallet connected successfully."
        });
      } else {
        setWallet({
          hasProvider: true,
          account: "",
          balance: "",
          chainId: network.chainId.toString(),
          statusText: "MetaMask responded, but no account is active yet."
        });
      }
    } catch (error) {
      setErrorText(getWalletErrorMessage(error));
      setWallet((current) => ({
        ...current,
        hasProvider: current.hasProvider ?? true,
        statusText: "Wallet connection did not finish."
      }));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <section className={`${compact ? "card wallet-panel wallet-panel-compact" : "card wallet-panel"}`}>
      <div className="panel-title-row">
        <div>
          <p className="kicker">Wallet</p>
          <h3>{compact ? "MetaMask status" : "MetaMask checkout and escrow"}</h3>
        </div>
        <span className="status-pill status-success">{compact ? "Local node" : "Ready for demo"}</span>
      </div>
      <p>
        {compact
          ? "Connect a wallet when you want to test the live local contracts instead of mock marketplace data."
          : "Connect a buyer or farmer wallet to move from demo browsing into real contract-backed checkout and escrow."}
      </p>
      <div className="tag-row wallet-status-row">
        <span className="status-pill">
          {wallet.hasProvider === null ? "Checking provider" : wallet.hasProvider ? "Provider found" : "Provider missing"}
        </span>
        <span className="status-pill">Chain {wallet.chainId || "unknown"}</span>
      </div>
      <div className="notice-card">
        <strong>Wallet status</strong>
        <p>{errorText || wallet.statusText}</p>
      </div>
      {wallet.account ? (
        <div className="wallet-account-block">
          <div className="info-row">
            <span>Account</span>
            <strong className="mono">{wallet.account}</strong>
          </div>
          <div className="info-row">
            <span>Balance</span>
            <strong>{wallet.balance}</strong>
          </div>
        </div>
      ) : wallet.hasProvider === false ? (
        <div className="wallet-actions">
          <button className="button" onClick={retryDetection}>
            Retry detection
          </button>
          <Link className="ghost-button" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
            Install MetaMask
          </Link>
        </div>
      ) : (
        <div className="wallet-actions">
          <button className="button" onClick={connectWallet} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect MetaMask"}
          </button>
          <button className="ghost-button" onClick={retryDetection}>
            Refresh wallet
          </button>
        </div>
      )}
    </section>
  );
}
