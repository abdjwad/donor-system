// ─────────────────────────────────────────────────────────────────
// view-ledger.js — عرض سجل التبرعات مباشرة من البلوكتشين نفسه (بدون
// المرور بقاعدة بيانات المنصة إطلاقاً) — للعرض المباشر والتحقق المستقل
//
// الاستخدام:
//   npx hardhat run scripts/view-ledger.js --network ganache
// ─────────────────────────────────────────────────────────────────

const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(addressesPath)) {
    console.error(`❌ ما في نشر مسجَّل على شبكة "${network.name}" — انشر العقود أول.`);
    process.exit(1);
  }
  const { contracts } = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const donation = await ethers.getContractAt("BunianDonation", contracts.BunianDonation.address);

  console.log("\n═══════════════════════════════════════════════");
  console.log(`     📒 سجل التبرعات المباشر — شبكة ${network.name}`);
  console.log("═══════════════════════════════════════════════\n");

  console.log(`📍 عنوان العقد: ${contracts.BunianDonation.address}\n`);

  const total = await donation.totalRaised();
  const count = await donation.getDonationsCount();

  console.log(`💰 إجمالي المتحصَّل  : ${ethers.formatEther(total)} ETH`);
  console.log(`🧾 عدد التبرعات     : ${count}\n`);

  if (count === 0n) {
    console.log("لا توجد تبرعات مسجَّلة على السلسلة بعد.\n");
    return;
  }

  const limit  = Number(count) > 20 ? 20 : Number(count);
  const recent = await donation.getRecentDonations(limit);

  console.log("─────────────────────────────────────────────");
  recent.forEach((d, i) => {
    const date = new Date(Number(d.timestamp) * 1000).toLocaleString("ar-EG");
    console.log(`[${i + 1}] ${ethers.formatEther(d.amount)} ETH`);
    console.log(`    من       : ${d.donor}`);
    console.log(`    للمشروع  : ${d.projectId}`);
    console.log(`    الرسالة  : ${d.message || "—"}`);
    console.log(`    الوقت    : ${date}`);
    console.log("─────────────────────────────────────────────");
  });
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
