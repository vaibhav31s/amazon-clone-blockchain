// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMartCoin {
    function charge(address from, uint256 value) external;
}

/// @title BlockMart
/// @notice A small on-chain shop. Prices and stock live here, every order is
///         stored here, and paying is one transaction in MartCoin.
contract BlockMart {
    struct Item {
        uint256 id;
        string name;
        uint256 price; // in MART (18 decimals)
        uint32 stock;
        uint32 sold;
        bool active;
    }

    struct Line {
        uint32 itemId;
        uint32 qty;
        uint256 price; // unit price paid
    }

    struct Order {
        uint256 id;
        address buyer;
        uint64 time;
        uint256 total;
        Line[] lines;
    }

    IMartCoin public immutable coin;
    address public immutable owner;

    Item[] private _items;
    Order[] private _orders;
    mapping(address => uint256[]) private _orderIdsOf;

    uint256 public constant MAX_LINES = 20;

    event ItemAdded(uint256 indexed id, string name, uint256 price, uint32 stock);
    event ItemUpdated(uint256 indexed id, uint256 price, uint32 stock, bool active);
    event OrderPlaced(uint256 indexed orderId, address indexed buyer, uint256 total, uint256 lineCount);
    event ItemPurchased(uint256 indexed orderId, uint256 indexed itemId, address indexed buyer, uint32 qty, uint256 price);

    error NotOwner();
    error EmptyCart();
    error TooManyLines();
    error LengthMismatch();
    error UnknownItem(uint256 id);
    error ItemInactive(uint256 id);
    error ZeroQuantity(uint256 id);
    error OutOfStock(uint256 id, uint32 left, uint32 wanted);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address coin_) {
        coin = IMartCoin(coin_);
        owner = msg.sender;
    }

    // ---- catalogue (owner) ----

    function addItem(string calldata name, uint256 price, uint32 stock) external onlyOwner returns (uint256 id) {
        id = _items.length;
        _items.push(Item({id: id, name: name, price: price, stock: stock, sold: 0, active: true}));
        emit ItemAdded(id, name, price, stock);
    }

    function updateItem(uint256 id, uint256 price, uint32 stock, bool active) external onlyOwner {
        if (id >= _items.length) revert UnknownItem(id);
        Item storage it = _items[id];
        it.price = price;
        it.stock = stock;
        it.active = active;
        emit ItemUpdated(id, price, stock, active);
    }

    // ---- shopping ----

    /// @notice Buy a whole cart in one transaction.
    function checkout(uint32[] calldata itemIds, uint32[] calldata qtys) external returns (uint256 orderId) {
        uint256 n = itemIds.length;
        if (n == 0) revert EmptyCart();
        if (n > MAX_LINES) revert TooManyLines();
        if (n != qtys.length) revert LengthMismatch();

        orderId = _orders.length;
        _orders.push();
        Order storage o = _orders[orderId];
        o.id = orderId;
        o.buyer = msg.sender;
        o.time = uint64(block.timestamp);

        uint256 total;
        for (uint256 i; i < n; ++i) {
            uint256 id = itemIds[i];
            uint32 qty = qtys[i];
            if (id >= _items.length) revert UnknownItem(id);
            Item storage it = _items[id];
            if (!it.active) revert ItemInactive(id);
            if (qty == 0) revert ZeroQuantity(id);
            if (it.stock < qty) revert OutOfStock(id, it.stock, qty);

            it.stock -= qty;
            it.sold += qty;
            total += it.price * qty;
            o.lines.push(Line({itemId: uint32(id), qty: qty, price: it.price}));
            emit ItemPurchased(orderId, id, msg.sender, qty, it.price);
        }

        o.total = total;
        _orderIdsOf[msg.sender].push(orderId);
        coin.charge(msg.sender, total); // reverts the whole order if the buyer is short
        emit OrderPlaced(orderId, msg.sender, total, n);
    }

    // ---- views ----

    function itemCount() external view returns (uint256) {
        return _items.length;
    }

    function orderCount() external view returns (uint256) {
        return _orders.length;
    }

    function getItems() external view returns (Item[] memory) {
        return _items;
    }

    function getItem(uint256 id) external view returns (Item memory) {
        if (id >= _items.length) revert UnknownItem(id);
        return _items[id];
    }

    function getOrder(uint256 id) external view returns (Order memory) {
        return _orders[id];
    }

    function orderCountOf(address buyer) external view returns (uint256) {
        return _orderIdsOf[buyer].length;
    }

    /// @notice A buyer's most recent orders, newest first (up to `limit`).
    function getOrdersOf(address buyer, uint256 limit) external view returns (Order[] memory out) {
        uint256[] storage ids = _orderIdsOf[buyer];
        uint256 n = ids.length < limit ? ids.length : limit;
        out = new Order[](n);
        for (uint256 i; i < n; ++i) {
            out[i] = _orders[ids[ids.length - 1 - i]];
        }
    }
}
