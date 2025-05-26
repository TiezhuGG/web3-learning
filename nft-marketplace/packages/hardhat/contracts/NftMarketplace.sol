// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// 完整的去中心化合约市场github地址：https://github.com/Fantom-foundation/Artion-Contracts/blob/5c90d2bc0401af6fb5abf35b860b762b31dfee02/contracts/FantomMarketplace.sol

// 可以重构合约的点:
// 1. 如何使用任意代币支付? (可以集成Chainlink Price Feeds)
// 2. 以其他货币设定价格?

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price); // 买家支付的ETH不足
// error ItemNotForSale(address nftAddress, uint256 tokenId);  // 物品没有在出售中
error NotListed(address nftAddress, uint256 tokenId); // 物品未上架
error AlreadyListed(address nftAddress, uint256 tokenId); // 物品已上架
error NoProceeds(); // 没有可提取的收益
error NotOwner(); // 调用者不是NFT的所有者
error NotApprovedForMarketplace(); // Marketplace合约未被授权操作该NFT
error PriceMustBeAboveZero(); // 价格必须大于0
error IsOwner(); // NFT的所有者不能购买自己的NFT

contract NftMarketplace {
    /*
     * @notice Listing Struct - 存储每个NFT的价格和卖家地址
     * @param price 价格
     * @param seller 卖家地址
     */
    struct Listing {
        uint256 price;
        address seller;
    }

    /*
     * @notice Event for listing NFT
     * @param seller 卖家地址
     * @param nftAddress NFT合约地址
     * @param tokenId NFT的Token ID
     * @param price 价格
     */
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    // NFT地址 => Token ID => Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // 存储每个卖家可提取的收益
    mapping(address => uint256) private s_proceeds;

    // 检查是否未上架
    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            // 价格大于0，说明已上架
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    // 检查是否已上架
    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            // 价格小于等于0，说明未上架
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    // 检查调用者是否是NFT的所有者
    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress); // 获取NFT合约实例
        address owner = nft.ownerOf(tokenId); // 调用ERC721的ownerOf方法获取NFT的所有者
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    // 检查调用者是否是NFT的所有者, 所有者不能购买自己的NFT
    modifier isNotOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender == owner) {
            revert IsOwner();
        }
        _;
    }

    /*
     * @notice 上架NFT
     * @param nftAddress NFT合约地址
     * @param tokenId NFT的Token ID
     * @param price 价格
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId) // 检查是否未上架
        isOwner(nftAddress, tokenId, msg.sender) // 检查调用者是否是NFT的所有者
    {
        if (price <= 0) {
            revert PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress); // 获取NFT合约实例
        // 检查Marketplace合约是否被NFT所有者授权操作该NFT
        if (nft.getApproved(tokenId) != address(this)) {
            revert NotApprovedForMarketplace();
        }
        // 记录上架NFT信息
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        // 触发上架事件
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId) // 检查是否已上架
    {
        delete (s_listings[nftAddress][tokenId]); // 从映射中删除上架信息
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    )
        external
        payable
        isListed(nftAddress, tokenId)
        isNotOwner(nftAddress, tokenId, msg.sender)
    {
        // 获取上架信息
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        // 检查买家支付的ETH是否足够
        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        // 将支付的ETH增加到卖家的收益中
        s_proceeds[listedItem.seller] += msg.value;
        // 从映射中删除上架信息（表示已售出）
        delete (s_listings[nftAddress][tokenId]);
        IERC721 nft = IERC721(nftAddress); // 获取NFT合约实例
        nft.safeTransferFrom(   //  调用ERC721合约的 safeTransferFrom 方法，转移NFT所有权给买家
            listedItem.seller, // 卖家地址
            msg.sender, // 买家地址
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    // 更新上架价格
    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (newPrice <= 0) {
            revert PriceMustBeAboveZero();
        }
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    // 提取收益
    function withdrawProceeds() external {
        // 检查卖家是否有可提取的收益
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NoProceeds();
        }
        // 将收益转移给卖家，并重置为0
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transfer failed");
    }

    // 获取某个NFT的上架信息
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    // 获取某个卖家的可提取收益
    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
