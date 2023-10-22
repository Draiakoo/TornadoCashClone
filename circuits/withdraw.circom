pragma circom 2.1.6;

include "./utils/MiMC5Sponge.circom";
include "./utils/commitment_hasher.circom";

template Withdraw() {
    signal input root;
    signal input nullifierHash;
    signal input recipient;

    signal input secret[256];
    signal input nullifier[256];
    signal input hashPairings[10];
    signal input hashDirections[10];

    component cHasher = CommitmentHasher();
    cHasher.secret <== secret;
    cHasher.nullifier <== nullifier;
    cHasher.nullifierHash === nullifierHash;

    component leafHashers[10];

    signal currentHash[10 + 1];
    currentHash[0] <== cHasher.commitment;

    signal left[10];
    signal right[10];

    for(var i = 0; i < 10; i++){
        left[i] <== (1 - hashDirections[i]) * currentHash[i];       // hashDirections =>     0=left      1=right
        right[i] <== hashDirections[i] * currentHash[i];

        leafHashers[i] = MiMC5Sponge(2);
        leafHashers[i].ins[0] <== left[i] + hashDirections[i] * hashPairings[i];
        leafHashers[i].ins[1] <== right[i] + (1 - hashDirections[i]) * hashPairings[i];

        leafHashers[i].k <== cHasher.commitment;
        currentHash[i + 1] <== leafHashers[i].o;
    }

    root === currentHash[10];

    signal recipientSquared;

    recipientSquared <== recipient * recipient;
}

component main {public [root, nullifierHash, recipient]} = Withdraw();