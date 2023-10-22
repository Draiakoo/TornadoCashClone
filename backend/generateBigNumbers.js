const { ethers } = require("ethers");

const numbersToGenerate = 10;

async function generate() {
    for(let i = 0; i < numbersToGenerate; i++){
        let n = ethers.BigNumber.from(ethers.utils.randomBytes(32));
        console.log(n.toString());
    }
}

generate().catch((err) => {console.log(err); process.exit(1);})