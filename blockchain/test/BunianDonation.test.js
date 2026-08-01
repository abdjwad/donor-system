const { expect }      = require("chai");
const { ethers }      = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("BunianDonation", function () {

  async function deployFixture() {
    const [owner, donor1, donor2, projectWallet] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("BunianDonation");
    const contract = await Contract.deploy();
    await contract.waitForDeployment();
    return { contract, owner, donor1, donor2, projectWallet };
  }

  describe("النشر الأولي", function () {
    it("المالك = ناشر العقد", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("إجمالي التبرعات = 0 عند النشر", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.totalRaised()).to.equal(0n);
    });

    it("الصندوق العام (projectId=0) مفعّل", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.projectActive(0)).to.be.true;
    });
  });

  describe("التبرع بـ ETH/MATIC", function () {
    it("يُسجّل التبرع ويحدّث الإحصائيات", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1.0");

      await contract.connect(donor1).donate(0, "للأطفال", { value: amount });

      expect(await contract.totalRaised()).to.equal(amount);
      expect(await contract.totalRaisedByProject(0)).to.equal(amount);
      expect(await contract.getDonationsCount()).to.equal(1n);
    });

    it("يُطلق حدث DonationReceived", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("0.5");

      await expect(contract.connect(donor1).donate(0, "", { value: amount }))
        .to.emit(contract, "DonationReceived");
    });

    it("يرفض مبلغاً أقل من 0.1 ETH", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);

      await expect(
        contract.connect(donor1).donate(0, "", { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("BunianDonation: amount below minimum");
    });

    it("يرفض التبرع لمشروع غير مفعّل", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);

      await expect(
        contract.connect(donor1).donate(99, "", { value: ethers.parseEther("1") })
      ).to.be.revertedWith("BunianDonation: project not active");
    });

    it("يجمع تبرعات متعددة بشكل صحيح", async function () {
      const { contract, donor1, donor2 } = await loadFixture(deployFixture);

      await contract.connect(donor1).donate(0, "", { value: ethers.parseEther("1") });
      await contract.connect(donor2).donate(0, "", { value: ethers.parseEther("2") });
      await contract.connect(donor1).donate(0, "", { value: ethers.parseEther("0.5") });

      expect(await contract.totalRaised()).to.equal(ethers.parseEther("3.5"));
      expect(await contract.getDonationsCount()).to.equal(3n);
    });
  });

  describe("إدارة المشاريع", function () {
    it("المالك يُفعّل مشروعاً جديداً", async function () {
      const { contract, owner } = await loadFixture(deployFixture);
      await contract.connect(owner).setProjectActive(1, true);
      expect(await contract.projectActive(1)).to.be.true;
    });

    it("غير المالك لا يستطيع التفعيل", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(donor1).setProjectActive(1, true)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  describe("سحب الأموال", function () {
    it("المالك يسحب الأموال بنجاح", async function () {
      const { contract, owner, donor1, projectWallet } = await loadFixture(deployFixture);

      await contract.connect(donor1).donate(0, "", { value: ethers.parseEther("5") });

      const before = await ethers.provider.getBalance(projectWallet.address);
      await contract.connect(owner).withdrawToProject(
        0, projectWallet.address, ethers.parseEther("3")
      );
      const after = await ethers.provider.getBalance(projectWallet.address);
      expect(after - before).to.equal(ethers.parseEther("3"));
    });

    it("غير المالك لا يستطيع السحب", async function () {
      const { contract, donor1, projectWallet } = await loadFixture(deployFixture);
      await contract.connect(donor1).donate(0, "", { value: ethers.parseEther("1") });

      await expect(
        contract.connect(donor1).withdrawToProject(0, projectWallet.address, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  describe("قراءة البيانات", function () {
    it("getDonationsPaginated يُعيد الصفحة الصحيحة", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++)
        await contract.connect(donor1).donate(0, "", { value: ethers.parseEther("0.1") });

      const page = await contract.getDonationsPaginated(1, 3);
      expect(page.length).to.equal(3);
    });

    it("getRecentDonations يُعيد آخر N تبرع", async function () {
      const { contract, donor1 } = await loadFixture(deployFixture);
      for (let i = 0; i < 4; i++)
        await contract.connect(donor1).donate(0, "", { value: ethers.parseEther("0.1") });

      const recent = await contract.getRecentDonations(2);
      expect(recent.length).to.equal(2);
    });
  });
});
