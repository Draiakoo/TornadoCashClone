// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {Hasher} from "./Hasher.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[3] calldata _pubSignals
    ) external;
}

contract Tornado is ReentrancyGuard {
    error WrongAmountDeposited(uint256 amount);
    error CommitmentAlreadyRegistered(uint256 commitment);
    error MerkleTreeFull();
    error IndexOutOfBound(uint256 index);
    error InvalidRoot();
    error NullifierAlreadyUsed();
    error InvalidProof();
    error PaymentFailed();

    event Deposit(uint256 root, uint256[10] hashPairings, uint8[10] pairDirections);
    event Withdrawal(address to, uint256 nullifierHash);

    Hasher public hasher;
    address public verifier;

    uint8 public treeLevel = 10;
    uint256 public denomination = 0.001 ether;
    uint256 public nextLeafIndex;

    mapping(uint256 root => bool isKnown) public knownRoots;
    mapping(uint8 level => uint256 levelHash) public lastLevelHash;
    mapping(uint256 nullifier => bool hasBeenUsed) public nullifiers;
    mapping(uint256 commitment => bool isRegistered) public commitments;

    constructor(address _hasher, address _verifier) {
        hasher = Hasher(_hasher);
        verifier = _verifier;
    }

    function deposit(uint256 _commitment) external payable nonReentrant {
        if (msg.value != denomination) {
            revert WrongAmountDeposited(msg.value);
        }
        if (commitments[_commitment]) {
            revert CommitmentAlreadyRegistered(_commitment);
        }
        if (nextLeafIndex > 2 ** treeLevel - 1) {
            revert MerkleTreeFull();
        }

        uint256 newRoot;
        uint256[10] memory hashPairings;
        uint8[10] memory hashDirections; // 0 means left, 1 means right

        uint256 currentIndex = nextLeafIndex;
        uint256 currentHash = _commitment;

        uint256 right;
        uint256 left;
        uint256[] memory MiMC5SpongeInputs = new uint256[](2);

        for (uint8 i; i < treeLevel; i++) {
            lastLevelHash[treeLevel] = currentHash;

            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = levelDefaults(i);
                hashPairings[i] = levelDefaults(i);
                hashDirections[i] = 0;
            } else {
                left = lastLevelHash[i];
                right = currentHash;
                hashPairings[i] = lastLevelHash[i];
                hashDirections[i] = 1;
            }

            MiMC5SpongeInputs[0] = left;
            MiMC5SpongeInputs[1] = right;

            (uint256 hashResult) = hasher.MiMC5Sponge(MiMC5SpongeInputs, _commitment);

            currentHash = hashResult;
            currentIndex /= 2;
        }

        newRoot = currentHash;
        knownRoots[newRoot] = true;
        ++nextLeafIndex;
        commitments[_commitment] = true;

        emit Deposit(newRoot, hashPairings, hashDirections);
    }

    function withdraw(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[2] memory input)
        external
        nonReentrant
    {
        uint256 root = input[0];
        uint256 nullifierHash = input[1];

        if (!knownRoots[root]) {
            revert InvalidRoot();
        }
        if (nullifiers[nullifierHash]) {
            revert NullifierAlreadyUsed();
        }
        (bool success,) = verifier.call(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3])",
                a,
                b,
                c,
                [root, nullifierHash, uint256(uint160(msg.sender))]
            )
        );
        if(!success){
            revert InvalidProof();
        }
        nullifiers[nullifierHash] = true;
        (bool paymentOk, ) = msg.sender.call{value: denomination}("");
        if(!paymentOk){
            revert PaymentFailed();
        }

        emit Withdrawal(msg.sender, nullifierHash);
    }

    function levelDefaults(uint256 index) internal pure returns (uint256) {
        if (index > 9) {
            revert IndexOutOfBound(index);
        }

        uint256[10] memory hashes = [
            11453634411542844787499634721323414931465088881580445903117236537484788828581,
            21759559294542366315284509249586907808062322870962667765282157872669179426305,
            2800814587524735286159569377379752927188029721286562875729267220991164399242,
            87253568801316884066334864872212400487325631090541227847966176534645555967330,
            16091454649916794623929336129931295998098934060451480326351876193731015714666,
            110276519996832799046081358197168128650129019969002202844137231385581283223032,
            24361892621379661372463289462581121875681948013554894918820988553066750189444,
            3803846826699328777041246343939067304378981667725046445242884711909804349800,
            1246292310160105430640667147666993977742994472446958122107028133142438347983,
            60783858348513431507842163713811445103610436806650599349647377026990568035512
        ];

        return hashes[index];
    }
}
