const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const verificationTrustAddress = process.env.POLYGON_VERIFICATION_ADDRESS;
  const cropBatchAddress = process.env.POLYGON_CROP_BATCH_ADDRESS;
  const marketplaceAddress = process.env.POLYGON_MARKETPLACE_ADDRESS;
  const escrowAddress = process.env.POLYGON_ESCROW_ADDRESS;

  let verificationTrust;
  if (verificationTrustAddress) {
    verificationTrust = await hre.ethers.getContractAt("VerificationTrust", verificationTrustAddress);
  } else {
    const VerificationTrust = await hre.ethers.getContractFactory("VerificationTrust");
    verificationTrust = await VerificationTrust.deploy();
    await verificationTrust.waitForDeployment();
  }

  let cropBatch;
  if (cropBatchAddress) {
    cropBatch = await hre.ethers.getContractAt("CropBatch", cropBatchAddress);
  } else {
    const CropBatch = await hre.ethers.getContractFactory("CropBatch");
    cropBatch = await CropBatch.deploy();
    await cropBatch.waitForDeployment();
  }

  let marketplace;
  if (marketplaceAddress) {
    marketplace = await hre.ethers.getContractAt("Marketplace", marketplaceAddress);
  } else {
    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(await cropBatch.getAddress());
    await marketplace.waitForDeployment();
  }

  let escrowSettlement;
  if (escrowAddress) {
    escrowSettlement = await hre.ethers.getContractAt("EscrowSettlement", escrowAddress);
  } else {
    const EscrowSettlement = await hre.ethers.getContractFactory("EscrowSettlement");
    escrowSettlement = await EscrowSettlement.deploy(
      await marketplace.getAddress(),
      await verificationTrust.getAddress()
    );
    await escrowSettlement.waitForDeployment();
  }

  const currentManagerState = await marketplace.authorizedManagers(await escrowSettlement.getAddress());
  if (!currentManagerState) {
    const authTx = await marketplace.setAuthorizedManager(await escrowSettlement.getAddress(), true);
    await authTx.wait();
    console.log("Authorized EscrowSettlement as Marketplace manager");
  }

  console.log("VerificationTrust:", await verificationTrust.getAddress());
  console.log("CropBatch:", await cropBatch.getAddress());
  console.log("Marketplace:", await marketplace.getAddress());
  console.log("EscrowSettlement:", await escrowSettlement.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
