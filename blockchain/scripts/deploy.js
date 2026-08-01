// ─────────────────────────────────────────────────────────────────
// deploy.js — نشر عقود منصة بنيان
//
// الاستخدام:
//   npx hardhat run scripts/deploy.js --network hardhat   ← Hardhat محلي
//   npx hardhat run scripts/deploy.js --network ganache   ← Ganache
//   npx hardhat run scripts/deploy.js --network amoy      ← Polygon Testnet
// ─────────────────────────────────────────────────────────────────

const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 نشر عقود منصة بنيان...");
  console.log(`📡 الشبكة: ${network.name}\n`);

  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log(`👤 المحفظة : ${deployer.address}`);
  console.log(`💰 الرصيد  : ${ethers.formatEther(balance)} ETH/MATIC\n`);

  // ── 1. نشر BunianDonation ─────────────────────────────────────
  console.log("📄 نشر BunianDonation.sol ...");
  const DonationFactory = await ethers.getContractFactory("BunianDonation");
  const donation        = await DonationFactory.deploy();
  await donation.waitForDeployment();
  const donationAddr    = await donation.getAddress();
  console.log(`✅ BunianDonation : ${donationAddr}`);

  // ── 2. نشر BunianProject ──────────────────────────────────────
  console.log("\n📄 نشر BunianProject.sol ...");
  const ProjectFactory  = await ethers.getContractFactory("BunianProject");
  const projectContract = await ProjectFactory.deploy();
  await projectContract.waitForDeployment();
  const projectAddr     = await projectContract.getAddress();
  console.log(`✅ BunianProject  : ${projectAddr}`);

  // ── 3. ربط العقدين ────────────────────────────────────────────
  console.log("\n🔗 ربط العقدين ...");
  await (await projectContract.setDonationContract(donationAddr)).wait();
  console.log("✅ تم الربط");


  // ── 5. حفظ العناوين ───────────────────────────────────────────
  const explorerBase = {
    hardhat: "",
    ganache: "",
    amoy:    "https://amoy.polygonscan.com/address",
    polygon: "https://polygonscan.com/address",
  };

  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const output = {
    network:    network.name,
    chainId,
    deployedAt: new Date().toISOString(),
    deployer:   deployer.address,
    contracts: {
      BunianDonation: {
        address:     donationAddr,
        explorerUrl: explorerBase[network.name]
          ? `${explorerBase[network.name]}/${donationAddr}` : "",
      },
      BunianProject: {
        address:     projectAddr,
        explorerUrl: explorerBase[network.name]
          ? `${explorerBase[network.name]}/${projectAddr}` : "",
      },
    },
  };

  // حفظ في deployments/
  fs.writeFileSync(
    path.join(__dirname, "..", "deployments", `${network.name}.json`),
    JSON.stringify(output, null, 2)
  );

  // نسخة للـ Angular
  const angularDir = path.join(__dirname, "..", "..", "src", "app", "core", "blockchain");
  fs.mkdirSync(angularDir, { recursive: true });
  fs.writeFileSync(
    path.join(angularDir, "contract-addresses.json"),
    JSON.stringify(output.contracts, null, 2)
  );

  console.log("\n" + "═".repeat(52));
  console.log("🎉 تم النشر بنجاح!");
  console.log("═".repeat(52));
  console.log(`📋 BunianDonation : ${donationAddr}`);
  console.log(`📋 BunianProject  : ${projectAddr}`);
  console.log(`📁 deployments/${network.name}.json ✓`);
  console.log(`📁 src/app/core/blockchain/contract-addresses.json ✓\n`);
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
