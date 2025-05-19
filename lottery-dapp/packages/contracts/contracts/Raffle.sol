// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error Raffle_NotEnoughETHEntered();
error Raffle_TransferFailed();

contract Raffle {
    uint256 private immutable i_entranceFee; // 彩票费用
    address payable[] private s_players; // 参与者地址列表
    address private s_recentWinner; // 最近的赢家

    event RaffleEnter(address indexed player);
    event WinnerPicked(address indexed winner);
    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    // 允许用户支付费用参与彩票
    function enterRaffle() public payable {
        // require(msg.value > i_entranceFee, "Not enough ETH!")
        if (msg.value < i_entranceFee) {
            revert Raffle_NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    // 选择赢家
    function pinkRandomWinner() public {
        require(s_players.length > 0, "No players entered!");

        uint256 randomNumber = getRandomNumber();
        uint256 winnerIndex = randomNumber % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner;

        // 发送奖金给赢家
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle_TransferFailed();
        }
        // 重置参与者列表，准备下一轮
        s_players = new address payable[](0);

        emit WinnerPicked(recentWinner);
    }

    // 生成一段伪随机数（具体项目要用chainlink）
    function getRandomNumber() public view returns (uint256) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, s_players)
            )
        );
        return randomNumber;
    }

    // 获取彩票费用
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    // 获取当前彩票参与者
    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    // 获取最近的赢家
    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
