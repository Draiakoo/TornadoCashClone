// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/Hasher.sol";

contract MiMC5SpongeTest is Test {
    Hasher public mimc5sponge;

    function setUp() public {
        mimc5sponge = new Hasher();
    }

    function testMiMC5FeistelHash() public {
        (uint256 oL, uint256 oR) = mimc5sponge.MiMC5Feisel(3242354325, 4325435, 245245);
        assertEq(oL, 8837830571168999371636316978396290649964844244927436951622789549418401782442);
        assertEq(oR, 1707127888127522098277287663265527022557476555573516865095578730680645395594);
    }

    function testMiMC5SpongeHash() public {
        uint256[] memory elements = new uint256[](2);
        elements[0] = 23454643;
        elements[1] = 643563443;
        uint256 k = 47382562734;
        (uint256 outputHash) = mimc5sponge.MiMC5Sponge(elements, k);
        assertEq(outputHash, 13115782996009263776608177727694227509844941584942039874874831953564647084172);
    }
}
