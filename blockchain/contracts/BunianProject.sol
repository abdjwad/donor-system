// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────
// BunianProject — إدارة مشاريع إعادة الإعمار
//
// ما يفعله هذا العقد:
//   1. يُسجّل كل مشروع إعادة إعمار (اسم + هدف تمويلي + موقع)
//   2. يُقسّم كل مشروع إلى مراحل (milestones)
//   3. يُفرج عن الأموال فقط عند اكتمال كل مرحلة
//   4. يربط مع BunianDonation عبر projectId
//
// مثال على تدفق مشروع:
//   createProject("مدرسة حلب", 50000 MATIC)
//     → addMilestone(0, "أساسات", 15000)
//     → addMilestone(0, "هيكل", 25000)
//     → addMilestone(0, "تشطيب", 10000)
//   تبرعات تصل → completeMilestone(0, 0) → releaseFunds(0, 0)
// ─────────────────────────────────────────────────────────────────

import "@openzeppelin/contracts/access/Ownable.sol";

contract BunianProject is Ownable {

    // ─────────────────────────────────────────────────────────────
    // ENUMS — التعدادات
    // ─────────────────────────────────────────────────────────────

    /// حالة المشروع
    enum ProjectStatus {
        Active,     // 0 — نشط يستقبل تبرعات
        Paused,     // 1 — موقوف مؤقتاً
        Completed,  // 2 — مكتمل بالكامل
        Cancelled   // 3 — ملغى
    }

    /// حالة المرحلة
    enum MilestoneStatus {
        Pending,    // 0 — لم تبدأ
        InProgress, // 1 — جارية
        Completed   // 2 — مكتملة
    }

    // ─────────────────────────────────────────────────────────────
    // STRUCTS — هياكل البيانات
    // ─────────────────────────────────────────────────────────────

    /// مرحلة من مراحل المشروع
    struct Milestone {
        string          descriptionAr;   // وصف المرحلة بالعربي
        string          descriptionEn;   // وصف المرحلة بالإنجليزي
        uint256         requiredAmount;  // المبلغ المطلوب لإتمام المرحلة (بـ wei)
        uint256         releasedAmount;  // المبلغ الذي أُفرج عنه
        MilestoneStatus status;
        uint256         completedAt;     // وقت الإكمال
    }

    /// مشروع إعادة الإعمار
    struct Project {
        uint256       id;
        string        titleAr;          // العنوان بالعربي
        string        titleEn;          // العنوان بالإنجليزي
        string        locationAr;       // الموقع بالعربي (مثال: حلب)
        string        locationEn;
        string        category;         // housing | education | health | water | infrastructure
        uint256       fundingGoal;      // الهدف التمويلي الكلي (بـ wei)
        uint256       amountRaised;     // ما جُمع حتى الآن (يُحدَّث من BunianDonation)
        ProjectStatus status;
        uint256       createdAt;
        address       projectWallet;    // محفظة المشروع الميداني تستقبل الأموال
        uint256       milestoneCount;
    }

    // ─────────────────────────────────────────────────────────────
    // STORAGE
    // ─────────────────────────────────────────────────────────────

    /// جميع المشاريع (projectId → Project)
    mapping(uint256 => Project) public projects;

    /// مراحل كل مشروع (projectId → milestoneIndex → Milestone)
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;

    /// عدد المشاريع الكلي
    uint256 public projectCount;

    /// عنوان عقد BunianDonation — يُعيّن مرة واحدة
    address public donationContract;

    // ─────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────

    event ProjectCreated(
        uint256 indexed projectId,
        string  titleAr,
        string  titleEn,
        string  category,
        uint256 fundingGoal,
        uint256 timestamp
    );

    event MilestoneAdded(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        string  descriptionAr,
        uint256 requiredAmount
    );

    event MilestoneCompleted(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 timestamp
    );

    event FundsReleased(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event ProjectStatusUpdated(
        uint256 indexed projectId,
        ProjectStatus   status
    );

    event AmountRaisedUpdated(
        uint256 indexed projectId,
        uint256 newTotal
    );

    // ─────────────────────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────────────────────

    modifier projectExists(uint256 projectId) {
        require(projectId < projectCount, "BunianProject: project not found");
        _;
    }

    modifier onlyDonationContract() {
        require(
            msg.sender == donationContract,
            "BunianProject: caller is not donation contract"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────

    /// @notice ربط عقد BunianDonation (يُستدعى مرة واحدة بعد النشر)
    function setDonationContract(address _donationContract) external onlyOwner {
        require(_donationContract != address(0), "BunianProject: invalid address");
        donationContract = _donationContract;
    }

    // ─────────────────────────────────────────────────────────────
    // WRITE — إدارة المشاريع (الإدارة فقط)
    // ─────────────────────────────────────────────────────────────

    /// @notice إنشاء مشروع جديد
    function createProject(
        string calldata titleAr,
        string calldata titleEn,
        string calldata locationAr,
        string calldata locationEn,
        string calldata category,
        uint256         fundingGoal,
        address         projectWallet
    ) external onlyOwner returns (uint256 projectId) {
        require(fundingGoal > 0,             "BunianProject: goal must be > 0");
        require(projectWallet != address(0), "BunianProject: invalid wallet");

        projectId = projectCount++;

        projects[projectId] = Project({
            id:             projectId,
            titleAr:        titleAr,
            titleEn:        titleEn,
            locationAr:     locationAr,
            locationEn:     locationEn,
            category:       category,
            fundingGoal:    fundingGoal,
            amountRaised:   0,
            status:         ProjectStatus.Active,
            createdAt:      block.timestamp,
            projectWallet:  projectWallet,
            milestoneCount: 0
        });

        emit ProjectCreated(
            projectId,
            titleAr,
            titleEn,
            category,
            fundingGoal,
            block.timestamp
        );
    }

    /// @notice إضافة مرحلة لمشروع
    function addMilestone(
        uint256        projectId,
        string calldata descriptionAr,
        string calldata descriptionEn,
        uint256        requiredAmount
    ) external onlyOwner projectExists(projectId) {
        require(requiredAmount > 0, "BunianProject: amount must be > 0");

        uint256 milestoneId = projects[projectId].milestoneCount++;

        milestones[projectId][milestoneId] = Milestone({
            descriptionAr:  descriptionAr,
            descriptionEn:  descriptionEn,
            requiredAmount: requiredAmount,
            releasedAmount: 0,
            status:         MilestoneStatus.Pending,
            completedAt:    0
        });

        emit MilestoneAdded(projectId, milestoneId, descriptionAr, requiredAmount);
    }

    /// @notice الإعلان عن اكتمال مرحلة (بعد التحقق الميداني)
    function completeMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyOwner projectExists(projectId) {
        Milestone storage m = milestones[projectId][milestoneId];
        require(m.status != MilestoneStatus.Completed, "BunianProject: already completed");

        m.status      = MilestoneStatus.Completed;
        m.completedAt = block.timestamp;

        emit MilestoneCompleted(projectId, milestoneId, block.timestamp);
    }

    /// @notice الإفراج عن أموال مرحلة مكتملة إلى محفظة المشروع
    /// @dev يستدعي BunianDonation.withdrawToProject داخلياً
    function releaseMilestoneFunds(
        uint256 projectId,
        uint256 milestoneId
    ) external onlyOwner projectExists(projectId) {
        Milestone storage m = milestones[projectId][milestoneId];
        require(
            m.status == MilestoneStatus.Completed,
            "BunianProject: milestone not completed"
        );
        require(m.releasedAmount == 0, "BunianProject: funds already released");

        uint256 amount = m.requiredAmount;
        m.releasedAmount = amount;

        address recipient = projects[projectId].projectWallet;

        emit FundsReleased(
            projectId,
            milestoneId,
            recipient,
            amount,
            block.timestamp
        );
    }

    /// @notice تحديث حالة مشروع
    function setProjectStatus(
        uint256       projectId,
        ProjectStatus status
    ) external onlyOwner projectExists(projectId) {
        projects[projectId].status = status;
        emit ProjectStatusUpdated(projectId, status);
    }

    /// @notice تحديث مبلغ التبرعات لمشروع (يُستدعى من BunianDonation)
    function updateAmountRaised(
        uint256 projectId,
        uint256 newTotal
    ) external onlyDonationContract projectExists(projectId) {
        projects[projectId].amountRaised = newTotal;
        emit AmountRaisedUpdated(projectId, newTotal);
    }

    // ─────────────────────────────────────────────────────────────
    // READ — قراءة البيانات (مجانية)
    // ─────────────────────────────────────────────────────────────

    /// @notice جلب بيانات مشروع كاملة
    function getProject(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (Project memory)
    {
        return projects[projectId];
    }

    /// @notice جلب كل المشاريع النشطة
    function getActiveProjects() external view returns (Project[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < projectCount; i++) {
            if (projects[i].status == ProjectStatus.Active) count++;
        }

        Project[] memory result = new Project[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < projectCount; i++) {
            if (projects[i].status == ProjectStatus.Active) {
                result[idx++] = projects[i];
            }
        }
        return result;
    }

    /// @notice جلب مرحلة معينة
    function getMilestone(uint256 projectId, uint256 milestoneId)
        external
        view
        projectExists(projectId)
        returns (Milestone memory)
    {
        return milestones[projectId][milestoneId];
    }

    /// @notice نسبة التقدم (0–100)
    function getFundingProgress(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (uint256)
    {
        Project memory p = projects[projectId];
        if (p.fundingGoal == 0) return 0;
        uint256 pct = (p.amountRaised * 100) / p.fundingGoal;
        return pct > 100 ? 100 : pct;
    }
}
