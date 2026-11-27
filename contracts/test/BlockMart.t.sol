// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MartCoin} from "../src/MartCoin.sol";
import {BlockMart} from "../src/BlockMart.sol";

contract BlockMartTest is Test {
    MartCoin coin;
    BlockMart shop;
    address alice = makeAddr("alice");
    address mallory = makeAddr("mallory");

    function setUp() public {
        coin = new MartCoin();
        shop = new BlockMart(address(coin));
        coin.setShop(address(shop));
        shop.addItem("Lamp", 50 ether, 5);
        shop.addItem("Mug", 12 ether, 100);
        vm.deal(alice, 10 ether);
        vm.deal(mallory, 10 ether);
    }

    function _cart(uint32 id, uint32 qty) internal pure returns (uint32[] memory ids, uint32[] memory qtys) {
        ids = new uint32[](1);
        qtys = new uint32[](1);
        ids[0] = id;
        qtys[0] = qty;
    }

    function test_buyCoins_fixedPrice() public {
        vm.prank(alice);
        coin.buy{value: 0.01 ether}();
        assertEq(coin.balanceOf(alice), 100 ether);
        assertEq(coin.totalSupply(), 100 ether);
        assertEq(address(coin).balance, 0.01 ether);
    }

    function test_plainEthTransferBuysCoins() public {
        vm.prank(alice);
        (bool ok,) = address(coin).call{value: 0.0001 ether}("");
        assertTrue(ok);
        assertEq(coin.balanceOf(alice), 1 ether);
    }

    function test_buyCoins_zeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(MartCoin.NoEthSent.selector);
        coin.buy();
    }

    function test_checkout_multiLine() public {
        vm.startPrank(alice);
        coin.buy{value: 0.02 ether}(); // 200 MART
        uint32[] memory ids = new uint32[](2);
        uint32[] memory qtys = new uint32[](2);
        ids[0] = 0; qtys[0] = 2; // 100
        ids[1] = 1; qtys[1] = 3; // 36
        uint256 orderId = shop.checkout(ids, qtys);
        vm.stopPrank();

        assertEq(orderId, 0);
        assertEq(coin.balanceOf(alice), 64 ether);
        assertEq(coin.balanceOf(address(shop)), 136 ether);
        BlockMart.Item memory lamp = shop.getItem(0);
        assertEq(lamp.stock, 3);
        assertEq(lamp.sold, 2);

        BlockMart.Order[] memory orders = shop.getOrdersOf(alice, 10);
        assertEq(orders.length, 1);
        assertEq(orders[0].total, 136 ether);
        assertEq(orders[0].lines.length, 2);
        assertEq(orders[0].lines[1].qty, 3);
        assertEq(orders[0].buyer, alice);
    }

    function test_checkout_notEnoughCoins_revertsEverything() public {
        vm.startPrank(alice);
        coin.buy{value: 0.001 ether}(); // 10 MART
        (uint32[] memory ids, uint32[] memory qtys) = _cart(0, 1);
        vm.expectRevert(abi.encodeWithSelector(MartCoin.InsufficientBalance.selector, 10 ether, 50 ether));
        shop.checkout(ids, qtys);
        vm.stopPrank();
        assertEq(shop.getItem(0).stock, 5);
        assertEq(shop.orderCount(), 0);
        assertEq(shop.orderCountOf(alice), 0);
    }

    function test_checkout_outOfStock() public {
        vm.startPrank(alice);
        coin.buy{value: 1 ether}();
        (uint32[] memory ids, uint32[] memory qtys) = _cart(0, 6);
        vm.expectRevert(abi.encodeWithSelector(BlockMart.OutOfStock.selector, 0, 5, 6));
        shop.checkout(ids, qtys);
        vm.stopPrank();
    }

    function test_checkout_sameItemTwice_cannotOversell() public {
        vm.startPrank(alice);
        coin.buy{value: 1 ether}();
        uint32[] memory ids = new uint32[](2);
        uint32[] memory qtys = new uint32[](2);
        ids[0] = 0; qtys[0] = 3;
        ids[1] = 0; qtys[1] = 3;
        vm.expectRevert(abi.encodeWithSelector(BlockMart.OutOfStock.selector, 0, 2, 3));
        shop.checkout(ids, qtys);
        vm.stopPrank();
    }

    function test_checkout_badInputs() public {
        vm.startPrank(alice);
        coin.buy{value: 1 ether}();
        uint32[] memory none = new uint32[](0);
        vm.expectRevert(BlockMart.EmptyCart.selector);
        shop.checkout(none, none);

        (uint32[] memory ids, uint32[] memory qtys) = _cart(9, 1);
        vm.expectRevert(abi.encodeWithSelector(BlockMart.UnknownItem.selector, 9));
        shop.checkout(ids, qtys);

        (ids, qtys) = _cart(1, 0);
        vm.expectRevert(abi.encodeWithSelector(BlockMart.ZeroQuantity.selector, 1));
        shop.checkout(ids, qtys);
        vm.stopPrank();
    }

    function test_inactiveItemCannotBeBought() public {
        shop.updateItem(1, 12 ether, 100, false);
        vm.startPrank(alice);
        coin.buy{value: 1 ether}();
        (uint32[] memory ids, uint32[] memory qtys) = _cart(1, 1);
        vm.expectRevert(abi.encodeWithSelector(BlockMart.ItemInactive.selector, 1));
        shop.checkout(ids, qtys);
        vm.stopPrank();
    }

    function test_onlyShopCanCharge() public {
        vm.prank(alice);
        coin.buy{value: 1 ether}();
        vm.prank(mallory);
        vm.expectRevert(MartCoin.NotShop.selector);
        coin.charge(alice, 1 ether);
    }

    function test_onlyOwnerAdmin() public {
        vm.startPrank(mallory);
        vm.expectRevert(BlockMart.NotOwner.selector);
        shop.addItem("Free stuff", 0, 1);
        vm.expectRevert(BlockMart.NotOwner.selector);
        shop.updateItem(0, 0, 1, true);
        vm.expectRevert(MartCoin.NotOwner.selector);
        coin.withdraw();
        vm.stopPrank();
        vm.expectRevert(MartCoin.ShopAlreadySet.selector);
        coin.setShop(mallory);
    }

    function test_erc20_transferAndAllowance() public {
        vm.startPrank(alice);
        coin.buy{value: 0.01 ether}();
        coin.transfer(mallory, 10 ether);
        coin.approve(mallory, 5 ether);
        vm.stopPrank();
        vm.startPrank(mallory);
        coin.transferFrom(alice, mallory, 5 ether);
        vm.expectRevert(abi.encodeWithSelector(MartCoin.InsufficientAllowance.selector, 0, 1));
        coin.transferFrom(alice, mallory, 1);
        vm.stopPrank();
        assertEq(coin.balanceOf(mallory), 15 ether);
        assertEq(coin.balanceOf(alice), 85 ether);
    }

    function test_ordersNewestFirstAndLimited() public {
        vm.startPrank(alice);
        coin.buy{value: 1 ether}();
        (uint32[] memory ids, uint32[] memory qtys) = _cart(1, 1);
        shop.checkout(ids, qtys);
        shop.checkout(ids, qtys);
        shop.checkout(ids, qtys);
        vm.stopPrank();
        BlockMart.Order[] memory orders = shop.getOrdersOf(alice, 2);
        assertEq(orders.length, 2);
        assertEq(orders[0].id, 2);
        assertEq(orders[1].id, 1);
    }

    function testFuzz_buyCoins(uint96 weiIn) public {
        vm.assume(weiIn > 0);
        vm.deal(alice, weiIn);
        vm.prank(alice);
        coin.buy{value: weiIn}();
        assertEq(coin.balanceOf(alice), uint256(weiIn) * 10000);
    }
}
