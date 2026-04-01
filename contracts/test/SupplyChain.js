const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SupplyChain", function () {
  async function deployFixture() {
    const [owner, farmer, distributor] = await ethers.getSigners();

    const Reputation = await ethers.getContractFactory("Reputation");
    const reputation = await Reputation.deploy(owner.address);
    await reputation.waitForDeployment();

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(owner.address);
    await escrow.waitForDeployment();

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy(
      await escrow.getAddress(),
      await reputation.getAddress(),
      owner.address
    );
    await supplyChain.waitForDeployment();

    await reputation.setSupplyChain(await supplyChain.getAddress());
    await escrow.setSupplyChain(await supplyChain.getAddress());

    return {
      owner,
      farmer,
      distributor,
      reputation,
      escrow,
      supplyChain
    };
  }

  it("runs farmer to distributor purchase flow with escrow release", async function () {
    const { owner, farmer, distributor, supplyChain, escrow } = await deployFixture();
    const deadline = (await time.latest()) + 3600;

    await supplyChain.connect(farmer).registerUser(1);
    await supplyChain.connect(distributor).registerUser(2);

    await supplyChain.connect(owner).verifyUser(farmer.address, true);
    await supplyChain.connect(owner).verifyUser(distributor.address, true);

    await supplyChain
      .connect(farmer)
      .produceItemByFarmer("BATCH-TOM-1001", "ipfs://demo-hash", 1000, deadline, deadline - 1200, "A");

    await supplyChain.connect(farmer).sellItemByFarmer(1, 1000);
    await supplyChain.connect(distributor).purchaseItemByDistributor(1, { value: 1000 });

    expect(await supplyChain.escrowByProduct(1)).to.equal(1);

    await supplyChain.connect(farmer).shippedItemByFarmer(1);
    await supplyChain.connect(distributor).receivedItemByDistributor(1);

    const product = await supplyChain.products(1);
    const escrowRecord = await escrow.escrows(1);

    expect(product.state).to.equal(5n);
    expect(product.currentOwner).to.equal(distributor.address);
    expect(escrowRecord.status).to.equal(2n);
  });
});

