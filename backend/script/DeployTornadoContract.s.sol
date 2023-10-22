// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import {Tornado} from "../src/Tornado.sol";
import {Hasher} from "../src/Hasher.sol";
import {Groth16Verifier} from "../src/Verifier.sol";

contract TornadoScript is Script {
    function setUp() public {}

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address account = vm.addr(privateKey);

        vm.startBroadcast(privateKey);
        address hasher = address(new Hasher());
        address verifier = address(new Groth16Verifier());
        Tornado tornado = new Tornado(hasher, verifier);
        vm.stopBroadcast();
    }
}
