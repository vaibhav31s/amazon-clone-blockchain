// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MartCoin (MART)
/// @notice The coin you shop with at BlockMart. Anyone can buy it with ETH at a
///         fixed price. The shop contract is the only address allowed to charge
///         a buyer directly, which makes checkout a single transaction.
contract MartCoin {
    string public constant name = "Mart Coin";
    string public constant symbol = "MART";
    uint8 public constant decimals = 18;

    /// @notice ETH price of one whole coin.
    uint256 public constant PRICE = 0.0001 ether;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public immutable owner;
    address public shop;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event CoinsBought(address indexed buyer, uint256 ethPaid, uint256 coins);
    event ShopSet(address indexed shop);

    error NotOwner();
    error NotShop();
    error ShopAlreadySet();
    error ZeroAddress();
    error NoEthSent();
    error InsufficientBalance(uint256 have, uint256 need);
    error InsufficientAllowance(uint256 have, uint256 need);
    error WithdrawFailed();

    constructor() {
        owner = msg.sender;
    }

    // ---- buying coins ----

    /// @notice Buy coins with ETH. 0.0001 ETH buys 1 MART.
    function buy() public payable returns (uint256 coins) {
        if (msg.value == 0) revert NoEthSent();
        coins = (msg.value * 1e18) / PRICE;
        totalSupply += coins;
        balanceOf[msg.sender] += coins;
        emit Transfer(address(0), msg.sender, coins);
        emit CoinsBought(msg.sender, msg.value, coins);
    }

    receive() external payable {
        buy();
    }

    // ---- ERC-20 ----

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance(allowed, value);
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientBalance(bal, value);
        unchecked {
            balanceOf[from] = bal - value;
        }
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    // ---- shop ----

    /// @notice One-time link to the shop contract.
    function setShop(address shop_) external {
        if (msg.sender != owner) revert NotOwner();
        if (shop != address(0)) revert ShopAlreadySet();
        if (shop_ == address(0)) revert ZeroAddress();
        shop = shop_;
        emit ShopSet(shop_);
    }

    /// @notice Called by the shop at checkout: moves the buyer's coins to the shop.
    ///         Only ever called with msg.sender of the checkout as `from`.
    function charge(address from, uint256 value) external {
        if (msg.sender != shop) revert NotShop();
        _transfer(from, shop, value);
    }

    function withdraw() external {
        if (msg.sender != owner) revert NotOwner();
        (bool ok,) = owner.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }
}
