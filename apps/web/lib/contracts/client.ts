"use client";

import { BrowserProvider, Contract } from "ethers";
import { contracts } from "@/lib/contracts/config";
import { escrowAbi, reputationAbi, supplyChainAbi } from "@/lib/contracts/abi";
import { getInjectedProvider } from "@/lib/wallet/provider";

export async function getBrowserProvider() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("MetaMask provider not found");
  }

  return new BrowserProvider(provider as never);
}

export async function requestWalletConnection() {
  const provider = await getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export async function getSupplyChainContract() {
  const signer = await requestWalletConnection();
  return new Contract(contracts.supplyChainAddress, supplyChainAbi, signer);
}

export async function getEscrowContract() {
  const signer = await requestWalletConnection();
  return new Contract(contracts.escrowAddress, escrowAbi, signer);
}

export async function getReputationContract() {
  const signer = await requestWalletConnection();
  return new Contract(contracts.reputationAddress, reputationAbi, signer);
}
