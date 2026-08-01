// ─────────────────────────────────────────────────────────────────
// interact.js — تجربة العقود يدوياً
// الأمر: npx hardhat run scripts/interact.js --network ganache
// ─────────────────────────────────────────────────────────────────

const { ethers } = require("hardhat");
const addresses  = require("../deployments/ganache.json");

const DONATION_ADDR = addresses.contracts.BunianDonation.address;
const PROJECT_ADDR  = addresses.contracts.BunianProject.address;

async function main() {
  const signers = await ethers.getSigners();
  const admin   = signers[0];  // المحفظة الأولى — المالك
  const donor1  = signers[1];  // متبرع 1
  const donor2  = signers[2];  // متبرع 2

  // ربط العقود
  const donation = await ethers.getContractAt("BunianDonation", DONATION_ADDR);
  const project  = await ethers.getContractAt("BunianProject",  PROJECT_ADDR);

  console.log("\n═══════════════════════════════════════════════");
  console.log("     🧪 تجربة عقود منصة بنيان");
  console.log("═══════════════════════════════════════════════\n");

  // ── 1. عرض المشاريع المتاحة ───────────────────────────────────
  console.log("📋 المشاريع المنشورة:");
  console.log("─────────────────────────────────────────────");
  const count = Number(await project.projectCount());
  for (let i = 0; i < count; i++) {
    const p = await project.getProject(i);
    const progress = await project.getFundingProgress(i);
    console.log(`  [${i}] ${p.titleAr}`);
    console.log(`      الهدف  : ${ethers.formatEther(p.fundingGoal)} ETH`);
    console.log(`      المُجمَّع: ${ethers.formatEther(p.amountRaised)} ETH`);
    console.log(`      التقدم : ${progress}%`);
    console.log();
  }

  // ── 2. أرصدة المحافظ قبل التبرع ─────────────────────────────
  console.log("💳 أرصدة المحافظ قبل التبرع:");
  console.log("─────────────────────────────────────────────");
  console.log(`  Admin  : ${ethers.formatEther(await ethers.provider.getBalance(admin.address))} ETH`);
  console.log(`  Donor1 : ${ethers.formatEther(await ethers.provider.getBalance(donor1.address))} ETH`);
  console.log(`  Donor2 : ${ethers.formatEther(await ethers.provider.getBalance(donor2.address))} ETH\n`);

  // ── 3. تبرعات ─────────────────────────────────────────────────
  console.log("💚 إجراء التبرعات...");
  console.log("─────────────────────────────────────────────");

  // Donor1 يتبرع 5 ETH لمشروع حلب (ID: 0)
  let tx = await donation.connect(donor1).donate(0, "من أجل أطفال حلب", {
    value: ethers.parseEther("5.0")
  });
  let receipt = await tx.wait();
  console.log(`  ✅ Donor1 تبرع 5 ETH لمشروع حلب [0]`);
  console.log(`     TX Hash: ${receipt.hash}`);

  // Donor2 يتبرع 3 ETH لمدرسة حمص (ID: 1)
  tx = await donation.connect(donor2).donate(1, "للمدارس", {
    value: ethers.parseEther("3.0")
  });
  receipt = await tx.wait();
  console.log(`  ✅ Donor2 تبرع 3 ETH لمدرسة حمص [1]`);
  console.log(`     TX Hash: ${receipt.hash}`);

  // Donor1 تبرع 2 ETH للصندوق العام (ID: 0 مفعّل افتراضياً كـ general fund)
  tx = await donation.connect(donor1).donate(0, "للصندوق العام", {
    value: ethers.parseEther("2.0")
  });
  receipt = await tx.wait();
  console.log(`  ✅ Donor1 تبرع 2 ETH مرة أخرى\n`);

  // ── 4. الإحصائيات بعد التبرع ─────────────────────────────────
  console.log("📊 الإحصائيات بعد التبرع:");
  console.log("─────────────────────────────────────────────");
  const total  = await donation.totalRaised();
  const forP0  = await donation.totalRaisedByProject(0);
  const forP1  = await donation.totalRaisedByProject(1);
  const dCount = await donation.getDonationsCount();
  const d1Count = await donation.donationCountByDonor(donor1.address);

  console.log(`  إجمالي جُمع : ${ethers.formatEther(total)} ETH`);
  console.log(`  مشروع [0]   : ${ethers.formatEther(forP0)} ETH`);
  console.log(`  مشروع [1]   : ${ethers.formatEther(forP1)} ETH`);
  console.log(`  عدد التبرعات: ${dCount}`);
  console.log(`  تبرعات Donor1: ${d1Count}\n`);

  // ── 5. قراءة آخر تبرعين ──────────────────────────────────────
  console.log("🕒 آخر 2 تبرعات:");
  console.log("─────────────────────────────────────────────");
  const recent = await donation.getRecentDonations(2);
  for (const d of recent) {
    const date = new Date(Number(d.timestamp) * 1000).toLocaleString("ar-SA");
    console.log(`  المتبرع  : ${d.donor}`);
    console.log(`  المبلغ   : ${ethers.formatEther(d.amount)} ETH`);
    console.log(`  المشروع  : [${d.projectId}]`);
    console.log(`  الرسالة  : "${d.message}"`);
    console.log(`  التوقيت  : ${date}`);
    console.log();
  }

  // ── 6. سحب أموال للمشروع (الإدارة فقط) ──────────────────────
  console.log("🏦 سحب 2 ETH لمشروع حلب (من الإدارة)...");
  console.log("─────────────────────────────────────────────");
  const projectWallet = signers[5].address; // محفظة المشروع الميداني
  const balBefore = await ethers.provider.getBalance(projectWallet);

  tx = await donation.connect(admin).withdrawToProject(
    0,
    projectWallet,
    ethers.parseEther("2.0")
  );
  await tx.wait();

  const balAfter = await ethers.provider.getBalance(projectWallet);
  console.log(`  ✅ تم السحب لـ ${projectWallet}`);
  console.log(`  قبل : ${ethers.formatEther(balBefore)} ETH`);
  console.log(`  بعد : ${ethers.formatEther(balAfter)} ETH`);
  console.log(`  الفرق: +${ethers.formatEther(balAfter - balBefore)} ETH\n`);

  // ── 7. رصيد العقد الآن ────────────────────────────────────────
  const contractBalance = await donation.getContractBalance();
  console.log("🏦 رصيد العقد الحالي:");
  console.log("─────────────────────────────────────────────");
  console.log(`  ${ethers.formatEther(contractBalance)} ETH\n`);

  console.log("═══════════════════════════════════════════════");
  console.log("✅ انتهت التجربة بنجاح!");
  console.log("═══════════════════════════════════════════════\n");
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
