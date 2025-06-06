// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GoalManage {
    enum GoalStatus {
        Active,
        Completed,
        Failed
    }

    struct Goal {
        address creator;
        uint256 stakedAmount;
        uint256 startTime;
        uint256 endTime;
        string proofHash; // 证明文件哈希
        GoalStatus status;
        uint256 progress; // 0-100
        address[] witnesses; // 见证者地址
    }

    uint256 public goalId;
    // 存储每个目标的详细信息
    mapping(uint256 => Goal) public goals;
    // 记录每个用户的目标
    mapping(address => uint256[]) public userGoals;
    // 记录每个见证人是否确认
    mapping(uint256 => mapping(address => bool)) public witnessConfirmed; // goalId => witness => bool
    // 记录每个见证人是否已提取份额
    mapping(uint256 => mapping(address => bool)) public hasWithdrawn; // goalId => witness => bool

    event GoalCreated(
        uint256 indexed goalId,
        address creator,
        uint256 stakedAmount,
        uint256 endTime,
        address[] witnesses
    );
    event ProgressUpdated(
        uint256 indexed goalId,
        uint256 newProgress,
        string proofHash
    );
    event GoalCompleted(uint256 indexed goalId);
    event GoalFailed(uint256 indexed goalId);
    event WitnessConfirmed(uint256 indexed goalId, address witness);
    event WithdrawnByCreator(
        uint256 indexed goalId,
        address creator,
        uint256 amount
    );
    event WithdrawnByWitness(
        uint256 indexed goalId,
        address witness,
        uint256 amount
    );

    modifier onlyGoalCreator(uint256 _goalId) {
        require(msg.sender == goals[_goalId].creator, "Not the goal creator.");
        _;
    }

    // modifier onlyGoalWitness(uint256 _goalId) {
    //     require(
    //         goals[_goalId].witnesses[msg.sender],
    //         "Not a witness for this goal"
    //     );
    //     _;
    // }

    // 创建目标
    function createGoal(
        uint256 _stakedAmount,
        uint256 _endTime,
        address[] memory _witnesses
    ) external payable {
        require(msg.value > 0, "Staking amount must be greater than 0");
        require(_endTime > block.timestamp, "End time must be in the future");

        uint256 _goalId = goalId++;
        goals[_goalId] = Goal({
            creator: msg.sender,
            stakedAmount: _stakedAmount,
            startTime: block.timestamp,
            endTime: _endTime,
            proofHash: "",
            status: GoalStatus.Active,
            progress: 0,
            witnesses: _witnesses
        });

        userGoals[msg.sender].push(_goalId);

        emit GoalCreated(
            _goalId,
            msg.sender,
            _stakedAmount,
            _endTime,
            _witnesses
        );
    }

    // 更新目标进度
    function updateProgress(
        uint256 _goalId,
        uint256 _newProgress,
        string memory _proofHash
    ) external onlyGoalCreator(_goalId) {
        Goal storage goal = goals[_goalId];

        require(goal.status == GoalStatus.Active, "Goal is not active.");
        require(block.timestamp <= goal.endTime, "Goal has ended.");
        require(_newProgress <= 100, "Progress cannot exceed 100%.");
        require(
            _newProgress > goals[_goalId].progress,
            "Progress cannot be decreased."
        );

        goal.progress = _newProgress;
        goal.proofHash = _proofHash;
        emit ProgressUpdated(_goalId, _newProgress, _proofHash);
    }

    function declareCompletion(uint256 _goalId) internal {
        Goal storage goal = goals[_goalId];

        require(msg.sender == goal.creator, "Not the goal creator.");
        require(goal.status == GoalStatus.Active, "Goal is not active.");
        require(block.timestamp > goal.endTime, "Goal has not ended.");
        require(goal.progress == 100, "Goal progress is not 100%");

        goal.status = GoalStatus.Completed;
        emit GoalCompleted(_goalId);
    }

    function declareFailed(uint256 _goalId) internal {
        Goal storage goal = goals[_goalId];

        require(goal.status == GoalStatus.Active, "Goal is not active.");
        require(block.timestamp > goal.endTime, "Goal has not ended.");

        goal.status = GoalStatus.Failed;
        emit GoalFailed(_goalId);
    }

    // 见证者确认
    function witnessConfirm(uint256 _goalId) external {
        Goal storage goal = goals[_goalId];

        require(goal.status == GoalStatus.Active, "Goal is not active.");
        require(block.timestamp <= goal.endTime, "Goal has ended.");

        // 检查调用者是否是见证人
        bool isWitness = false;
        for (uint256 i = 0; i < goal.witnesses.length; i++) {
            if (goal.witnesses[i] == msg.sender) {
                isWitness = true;
                break;
            }
        }

        require(isWitness, "Not a witness for this goal");
        witnessConfirmed[_goalId][msg.sender] = true;
        emit WitnessConfirmed(_goalId, msg.sender);
    }

    // 创建人提取份额
    function withdrawByCreator(
        uint256 _goalId
    ) external onlyGoalCreator(_goalId) {
        Goal storage goal = goals[_goalId];
        require(msg.sender == goal.creator, "Not the goal creator.");
        require(goal.status == GoalStatus.Completed, "Goal is not completed.");
        require(block.timestamp > goal.endTime, "Goal has ended.");

        // 检查多少个见证人确认
        uint256 confirmedCount = 0;
        for (uint256 i = 0; i < goal.witnesses.length; i++) {
            if (witnessConfirmed[_goalId][goal.witnesses[i]]) {
                confirmedCount++;
            }
        }

        // 检查是否超过一半确认
        require(
            confirmedCount >= goal.witnesses.length / 2,
            "Not enough witnesses confirmed."
        );
        goal.status = GoalStatus.Completed;
        uint256 amount = goal.stakedAmount;
        goal.stakedAmount = 0; // 防止重入
        // payable(msg.sender).transfer(amount);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit GoalCompleted(_goalId);
        emit WithdrawnByCreator(_goalId, msg.sender, amount);
    }

    // 见证者提取份额(目标失败时)
    function withdrawByWitness(uint256 _goalId) external {
        Goal storage goal = goals[_goalId];
        require(goal.status == GoalStatus.Failed, "Goal is not failed.");
        require(block.timestamp > goal.endTime, "Goal has ended.");
        // 检查调用者是否是见证人
        bool isWitness = false;
        for (uint256 i = 0; i < goal.witnesses.length; i++) {
            if (goal.witnesses[i] == msg.sender) {
                isWitness = true;
                break;
            }
        }

        require(isWitness, "Not a witness for this goal");
        require(
            hasWithdrawn[_goalId][msg.sender] == false,
            "Already withdrawn"
        );

        uint256 sharePerWitness = goal.stakedAmount / goal.witnesses.length;
        uint256 remainderAmount = goal.stakedAmount % goal.witnesses.length;
        // 将余数返还给目标创建者
        if (remainderAmount > 0) {
            payable(goal.creator).transfer(remainderAmount);
        }
        goal.stakedAmount -= sharePerWitness;
        hasWithdrawn[_goalId][msg.sender] = true;
        (bool success, ) = payable(msg.sender).call{value: sharePerWitness}("");
        require(success, "Witness withdraw failed");
        emit WithdrawnByWitness(_goalId, msg.sender, sharePerWitness);
    }

    function getUserGoals(address _user) external view returns (uint256[] memory) {
        return userGoals[_user];
    }

    function getGoal(uint256 _goalId) external view returns (Goal memory) {
        Goal storage goal = goals[_goalId];
        return goal;
    }

    //     function getGoal(uint256 _goalId) public view returns (
    //     address publisher,
    //     uint256 stakedAmount,
    //     address stakingToken,
    //     uint256 startTime,
    //     uint256 endTime,
    //     uint256 currentProgress,
    //     string memory proofIpfsHash,
    //     address memory witnessList,
    //     uint256 confirmationsCount,
    //     uint256 requiredConfirmations,
    //     GoalStatus status
    // ) {
    //     Goal storage goal = goals[_goalId];
    //     publisher = goal.publisher;
    //     stakedAmount = goal.stakedAmount;
    //     stakingToken = goal.stakingToken;
    //     startTime = goal.startTime;
    //     endTime = goal.endTime;
    //     currentProgress = goal.currentProgress;
    //     proofIpfsHash = goal.proofIpfsHash;
    //     witnessList = goal.witnessAddresses; // Return the array of witness addresses
    //     confirmationsCount = goal.confirmationsCount;
    //     requiredConfirmations = goal.requiredConfirmations;
    //     status = goal.status;
    // }
}
