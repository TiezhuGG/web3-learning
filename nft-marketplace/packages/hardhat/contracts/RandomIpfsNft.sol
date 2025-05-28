// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

error RandomIpfsNft_RangeOutOfBounds();
error RandomIpfsNft_NeedMoreETHSent();
error RandomIpfsNft_TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2Plus, ERC721URIStorage {
    // 类型声明 (预设10种pokemon随机出现)
    enum Rarity {
        Charizard,
        Infernape,
        Lucario,
        Pikachu,
        Squirtle,
        Dragonite,
        Gengar,
        Greninja,
        Mewtwo,
        Treecko
    }

    // VRF配置
    // 回调函数消耗的gas限制
    uint32 private constant CALLBACK_GAS_LIMIT = 300000;
    // 请求确认数
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    // 请求随机数个数
    uint32 private constant NUM_WORDS = 1;
    // 订阅ID
    uint256 public s_subscriptionId;

    // NFT变量
    // 铸造费用
    uint256 private immutable i_mintFee;
    // NFT计数器
    uint256 private s_tokenCounter;
    // 最大概率值
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    // NFT的URI
    string[] internal s_tokenURIs;
    bytes32 KEY_HASH =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

    // VRF请求追踪
    // 请求ID到发送者的映射
    mapping(uint256 => address) private s_requestIdToSender;

    event NFTRequested(uint256 indexed requestId, address requester);
    event NFTMinted(Rarity rarity, address minter);

    constructor(
        address vrfCoordinatorV2_5, // VRF Coordinator地址
        uint256 subscriptionId, // 订阅ID
        string[10] memory tokenURIs, // NFT的URI
        uint256 mintFee // 铸造费用
    )
        ERC721("Pokemon NFT", "PKM")
        VRFConsumerBaseV2Plus(vrfCoordinatorV2_5) // sepolia COORDINATOR地址
    {
        s_subscriptionId = subscriptionId;
        s_tokenURIs = tokenURIs;
        i_mintFee = mintFee;
    }

    modifier onlyVRFCoordinator() {
        require(
            msg.sender == address(s_vrfCoordinator),
            "Only VRFCoordinator can call"
        );
        _;
    }

    // 请求NFT
    function requestNft() public payable returns (uint256 requestId) {
        console.log("requestNft...", msg.value);
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft_NeedMoreETHSent();
        }

        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: KEY_HASH,
                subId: s_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: CALLBACK_GAS_LIMIT,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
        console.log("requestId....", requestId);
        // 将请求ID与发送者关联
        s_requestIdToSender[requestId] = msg.sender;
        // 触发NFT请求事件
        emit NFTRequested(requestId, msg.sender);
        console.log("NFTRequested event emitted.");
        return requestId;
    }

    // VRF回调函数
    // 在VRF请求完成后，VRF合约会调用这个函数
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override onlyVRFCoordinator {
        console.log("fulfillRandomWords....", requestId, randomWords[0]);
        // 获取NFT所有者
        address nftOwner = s_requestIdToSender[requestId];
        console.log("nftOwner....", nftOwner);
        // 生成新的tokenID
        uint256 newTokenId = s_tokenCounter++;
        console.log("newTokenId....", newTokenId);
        // 计算随机数
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        console.log("moddedRng....", moddedRng);
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
        uint256[10] memory chanceArray = getChanceArray(); // 获取概率数组

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
    function withdrawETH() public {
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
    function getChanceArray() public pure returns (uint256[10] memory) {
        // return [15, 15, 20, 20, MAX_CHANCE_VALUE - 70]; // 分别代表 15% 15% 20% 20% 30%的概率
        // 需要明确指定uint256类型，否则会报错
         uint256 ten = 10;
         uint256[10] memory chances = [ten, ten, ten, ten, ten, ten, ten, ten, ten, ten]; // 分别代表 10% 10% 10% 10% 10% 10% 10% 10% 10% 10%的概率
         return chances;
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
