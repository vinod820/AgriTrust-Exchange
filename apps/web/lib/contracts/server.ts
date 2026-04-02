import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { escrowSettlementAbi, verificationTrustAbi } from "@/lib/contracts/abi";
import { contracts, contractAddressState } from "@/lib/contracts/config";

function getServerRpcUrl() {
  return process.env.AMOY_RPC_URL ?? process.env.POLYGON_RPC_URL ?? contracts.amoyRpcUrl;
}

function getServerPrivateKey() {
  const rawKey = process.env.POLYGON_WALLET_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!rawKey || rawKey === "replace_me") {
    throw new Error(
      "The server wallet private key is missing. Set POLYGON_WALLET_PRIVATE_KEY in apps/web/.env.local to save verification on-chain."
    );
  }

  const normalized = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error("The configured server wallet private key is not a valid 32-byte hex string.");
  }

  return normalized;
}

function getVerificationContract() {
  if (!contractAddressState.verificationTrust) {
    throw new Error(
      "The VerificationTrust contract address is missing. Set NEXT_PUBLIC_VERIFICATION_TRUST_ADDRESS in apps/web/.env.local."
    );
  }

  const provider = new JsonRpcProvider(getServerRpcUrl());
  const signer = new Wallet(getServerPrivateKey(), provider);
  const contract = new Contract(contracts.verificationTrustAddress, verificationTrustAbi, signer);

  return { signer, contract };
}

function getEscrowContract() {
  if (!contractAddressState.escrowSettlement) {
    throw new Error(
      "The EscrowSettlement contract address is missing. Set NEXT_PUBLIC_ESCROW_SETTLEMENT_ADDRESS in apps/web/.env.local."
    );
  }

  const provider = new JsonRpcProvider(getServerRpcUrl());
  const signer = new Wallet(getServerPrivateKey(), provider);
  const contract = new Contract(contracts.escrowSettlementAddress, escrowSettlementAbi, signer);

  return { signer, contract };
}

export async function addVerificationOnChain(input: {
  batchId: number;
  videoHash: string;
  expertResult: string;
  aiQualityScore: number;
}) {
  const { signer, contract } = getVerificationContract();

  try {
    const tx = await contract.addVerification(
      BigInt(input.batchId),
      input.videoHash,
      input.expertResult,
      BigInt(Math.max(0, Math.min(100, Math.round(input.aiQualityScore))))
    );
    await tx.wait();

    return {
      transactionHash: tx.hash as string,
      signerAddress: await signer.getAddress()
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Only admin")) {
      throw new Error(
        "The configured server wallet is not the VerificationTrust admin wallet, so the verification could not be saved on-chain."
      );
    }

    throw error;
  }
}

export async function releaseEscrowOnChain(orderId: number) {
  const { signer, contract } = getEscrowContract();
  const tx = await contract.releasePayment(BigInt(orderId));
  await tx.wait();

  return {
    transactionHash: tx.hash as string,
    signerAddress: await signer.getAddress()
  };
}

export async function refundEscrowOnChain(orderId: number) {
  const { signer, contract } = getEscrowContract();
  const tx = await contract.refundBuyer(BigInt(orderId));
  await tx.wait();

  return {
    transactionHash: tx.hash as string,
    signerAddress: await signer.getAddress()
  };
}
