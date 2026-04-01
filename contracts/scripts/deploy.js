const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Reputation = await hre.ethers.getContractFactory("Reputation");
  const reputation = await Reputation.deploy(deployer.address);
  await reputation.waitForDeployment();

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(deployer.address);
  await escrow.waitForDeployment();

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy(
    await escrow.getAddress(),
    await reputation.getAddress(),
    deployer.address
  );
  await supplyChain.waitForDeployment();

  await (await reputation.setSupplyChain(await supplyChain.getAddress())).wait();
  await (await escrow.setSupplyChain(await supplyChain.getAddress())).wait();

  console.log("Reputation:", await reputation.getAddress());
  console.log("Escrow:", await escrow.getAddress());
  console.log("SupplyChain:", await supplyChain.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

