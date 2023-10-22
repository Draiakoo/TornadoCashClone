const uint256ToBin = (num) => {
    const string = BigInt(num).toString(2);
    const completingZeros = "0".repeat(256 - string.length);
    return (completingZeros + string).split("");
}

const uint256ToHex = (n) => {
    let nstr = BigInt(n).toString(16);
    while(nstr.length < 64){ nstr = "0" + nstr; }
    nstr = `0x${nstr}`;
    return nstr;
}

const reverseCoordinate = (p) => {
    let r = [0, 0];
    r[0] = p[1];
    r[1] = p[0];
    return r;
}

module.exports = {
    uint256ToBin,
    uint256ToHex,
    reverseCoordinate
}