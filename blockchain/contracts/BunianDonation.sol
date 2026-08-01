// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────
// BunianDonation — العقد الرئيسي لاستقبال التبرعات
//
// ما يفعله هذا العقد:
//   1. يستقبل تبرعات بعملة MATIC (العملة الأصلية لـ Polygon)
//   2. يُسجّل كل تبرع بشكل دائم على الـ blockchain
//   3. يُطلق حدثاً (event) لكل تبرع — يستطيع الـ frontend قراءته
//   4. يسمح فقط للمالك (الإدارة) بسحب الأموال للمشاريع
//
// المصطلحات:
//   - address    : عنوان المحفظة (42 حرف يبدأ بـ 0x)
//   - payable    : يعني الدالة تقبل استقبال MATIC
//   - view       : دالة قراءة فقط — لا تكلف gas
//   - onlyOwner  : يُنفَّذ فقط من محفظة الإدارة
//   - event      : إشعار يُبثّ على الـ blockchain — يقرأه ethers.js
// ─────────────────────────────────────────────────────────────────

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BunianDonation is Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────────────────────────
    // STRUCTS — هياكل البيانات
    // ─────────────────────────────────────────────────────────────

    /// @dev كل تبرع يُخزَّن بهذا الهيكل على الـ blockchain
    struct Donation {
        address donor;      // عنوان محفظة المتبرع
        uint256 amount;     // المبلغ بـ wei (1 MATIC = 10^18 wei)
        uint256 projectId;  // معرف المشروع (0 = الصندوق العام)
        uint256 timestamp;  // وقت التبرع (Unix timestamp)
        string  message;    // رسالة إهداء اختيارية
    }

    // ─────────────────────────────────────────────────────────────
    // STORAGE — التخزين الدائم على الـ blockchain
    // ─────────────────────────────────────────────────────────────

    /// قائمة كل التبرعات
    Donation[] public donations;

    /// إجمالي ما جُمع لكل مشروع (projectId → المبلغ الكلي)
    mapping(uint256 => uint256) public totalRaisedByProject;

    /// عدد تبرعات كل متبرع (address → العدد)
    mapping(address => uint256) public donationCountByDonor;

    /// هل المشروع مفعّل أم لا (projectId → true/false)
    mapping(uint256 => bool) public projectActive;

    /// إجمالي كل ما جُمع على المنصة
    uint256 public totalRaised;

    /// الحد الأدنى للتبرع (0.1 MATIC)
    uint256 public constant MIN_DONATION = 0.1 ether;

    // ─────────────────────────────────────────────────────────────
    // EVENTS — الأحداث التي يستمع إليها الـ frontend
    // ─────────────────────────────────────────────────────────────

    /// يُطلَق عند كل تبرع جديد — ethers.js يستمع لهذا
    event DonationReceived(
        address indexed donor,
        uint256 indexed projectId,
        uint256 amount,
        uint256 donationId,
        uint256 timestamp,
        string  message
    );

    /// يُطلَق عند سحب الأموال لمشروع
    event FundsWithdrawn(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /// يُطلَق عند تفعيل أو إيقاف مشروع
    event ProjectStatusChanged(uint256 indexed projectId, bool active);

    // ─────────────────────────────────────────────────────────────
    // CONSTRUCTOR — يُنفَّذ مرة واحدة عند نشر العقد
    // ─────────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {
        // تفعيل الصندوق العام (projectId = 0) تلقائياً
        projectActive[0] = true;
    }

    // ─────────────────────────────────────────────────────────────
    // WRITE FUNCTIONS — دوال الكتابة (تكلف gas)
    // ─────────────────────────────────────────────────────────────

    /// @notice التبرع بـ MATIC لمشروع معين أو الصندوق العام
    /// @param projectId معرف المشروع (0 = الصندوق العام)
    /// @param message   رسالة إهداء اختيارية
    /// @dev يجب إرسال MATIC مع الاستدعاء (payable)
    function donate(
        uint256 projectId,
        string calldata message
    ) external payable nonReentrant {
        // التحقق من الشروط
        require(msg.value >= MIN_DONATION, "BunianDonation: amount below minimum");
        require(projectActive[projectId], "BunianDonation: project not active");

        // تسجيل التبرع
        uint256 donationId = donations.length;
        donations.push(Donation({
            donor:     msg.sender,
            amount:    msg.value,
            projectId: projectId,
            timestamp: block.timestamp,
            message:   message
        }));

        // تحديث الإحصائيات
        totalRaisedByProject[projectId] += msg.value;
        donationCountByDonor[msg.sender]++;
        totalRaised += msg.value;

        // إطلاق الحدث — يُرسَل للـ frontend فوراً
        emit DonationReceived(
            msg.sender,
            projectId,
            msg.value,
            donationId,
            block.timestamp,
            message
        );
    }

    /// @notice سحب أموال مشروع معين لعنوان المستفيد
    /// @dev يُستدعى فقط من الإدارة بعد اكتمال مرحلة المشروع
    function withdrawToProject(
        uint256 projectId,
        address payable recipient,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(recipient != address(0), "BunianDonation: invalid recipient");
        require(amount > 0, "BunianDonation: amount must be > 0");
        require(
            address(this).balance >= amount,
            "BunianDonation: insufficient balance"
        );

        recipient.transfer(amount);

        emit FundsWithdrawn(projectId, recipient, amount, block.timestamp);
    }

    /// @notice تفعيل أو إيقاف مشروع
    function setProjectActive(uint256 projectId, bool active) external onlyOwner {
        projectActive[projectId] = active;
        emit ProjectStatusChanged(projectId, active);
    }

    // ─────────────────────────────────────────────────────────────
    // READ FUNCTIONS — دوال القراءة (مجانية — لا تكلف gas)
    // ─────────────────────────────────────────────────────────────

    /// @notice إجمالي عدد التبرعات
    function getDonationsCount() external view returns (uint256) {
        return donations.length;
    }

    /// @notice جلب تبرعات بالصفحات (pagination)
    /// @param offset  رقم البداية
    /// @param limit   عدد التبرعات في الصفحة
    function getDonationsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (Donation[] memory) {
        uint256 total = donations.length;
        if (offset >= total) return new Donation[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 size = end - offset;
        Donation[] memory result = new Donation[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = donations[offset + i];
        }
        return result;
    }

    /// @notice جلب آخر N تبرع
    function getRecentDonations(uint256 count) external view returns (Donation[] memory) {
        uint256 total = donations.length;
        if (total == 0) return new Donation[](0);

        uint256 size = count > total ? total : count;
        Donation[] memory result = new Donation[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = donations[total - 1 - i];
        }
        return result;
    }

    /// @notice الرصيد الحالي في العقد
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
