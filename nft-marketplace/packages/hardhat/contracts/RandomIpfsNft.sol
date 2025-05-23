// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFV2WrapperConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft_RangeOutOfBounds();
error RandomIpfsNft_NeedMoreETHSent();
error RandomIpfsNft_TransferFailed();

contract RandomIpfsNft is VRFV2WrapperConsumerBase, ERC721URIStorage, Ownable {
    // Address LINK - hardcoded for Sepolia
    // address public linkAddress = 0x779877A7B0D9E8603169DdbD7836e478b4624789;

    // address WRAPPER - hardcoded for Sepolia
    // address public wrapperAddress = 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1;

    // 类型声明
    enum Rarity {
        COMMON,
        RARE,
        SUPER_RARE
    }

    // VRF配置
    // 回调函数消耗的gas限制
    uint32 private constant CALLBACK_GAS_LIMIT = 500000;
    // 请求确认数
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    // 请求随机数个数
    uint32 private constant NUM_WORDS = 1;

    // NFT变量
    // 铸造费用
    uint256 private immutable i_mintFee;
    // NFT计数器
    uint256 private s_tokenCounter;
    // 最大概率值
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    // NFT的URI
    string[] internal s_tokenURIs;

    // VRF请求追踪
    // 请求ID到发送者的映射
    mapping(uint256 => address) private s_requestIdToSender;

    event NFTRequested(uint256 indexed requestId, address requester);
    event NFTMinted(Rarity rarity, address minter);

    constructor(
        address linkAddress, // VRF合约地址
        address wrapperAddress, // VRF包装器地址
        string[3] memory tokenURIs, // NFT的URI
        uint256 mintFee // 铸造费用
    )
        ERC721("Random IPFS NFT", "RIN")
        VRFV2WrapperConsumerBase(linkAddress, wrapperAddress)
        Ownable(msg.sender)
    {
        s_tokenURIs = tokenURIs;
        i_mintFee = mintFee;
    }

    // 请求NFT
    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft_NeedMoreETHSent();
        }
        // 调用VRF请求随机数
        requestId = requestRandomness(
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS,
            NUM_WORDS
        );
        // 将请求ID与发送者关联
        s_requestIdToSender[requestId] = msg.sender;
        // 触发NFT请求事件
        emit NFTRequested(requestId, msg.sender);
        return requestId;
    }

    // VRF回调函数
    // 在VRF请求完成后，VRF合约会调用这个函数
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        // 获取NFT所有者
        address nftOwner = s_requestIdToSender[requestId];
        // 生成新的tokenID
        uint256 newTokenId = s_tokenCounter++;
        // 计算随机数
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        // 根据随机数获取稀有度
        Rarity rarity = getRarityFromModdedRng(moddedRng);
        // 安全铸造NFT
        _safeMint(nftOwner, newTokenId);
        // 设置NFT的URI
        _setTokenURI(newTokenId, s_tokenURIs[uint256(rarity)]);
        // 触发NFT铸造事件
        emit NFTMinted(rarity, nftOwner);
    }

    // 根据随机数获取稀有度
    function getRarityFromModdedRng(
        uint256 moddedRng
    ) public pure returns (Rarity) {
        uint256 cumulativeSum = 0; // 累加概率
        uint256[3] memory chanceArray = getChanceArray(); // 获取概率数组

        // 遍历概率数组
        for (uint256 i = 0; i < chanceArray.length; i++) {
            // 如果随机数落在当前概率区间
            if (
                moddedRng >= cumulativeSum &&
                moddedRng < cumulativeSum + chanceArray[i]
            ) {
                return Rarity(i);
            }
            // 累加概率
            cumulativeSum += chanceArray[i];
        }
        // 如果随机数不在任何区间，抛出异常
        revert RandomIpfsNft_RangeOutOfBounds();
    }

    // 提款函数
    function withdrawETH() public onlyOwner {
        // 获取当前合约的ETH余额
        uint256 balance = address(this).balance;
        // 将ETH发送给合约所有者
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        // 如果发送失败，抛出异常
        if (!success) {
            revert RandomIpfsNft_TransferFailed();
        }
    }

    // 获取概率数组
    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE]; // 分别代表 SUPER_RARE(10%), RARE(20%), COMMON(60%)的概率
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getTokenURIs(uint256 index) public view returns (string memory) {
        return s_tokenURIs[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
