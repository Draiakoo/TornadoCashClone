// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

contract Hasher {
    uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256[20] c = [
        0,
        105459342437457812771135172323083229699880076558714389201963426671496941082218,
        44701464856968139370917285707027820936722631087422041426223071261295627070036,
        41130458804021533314412899450586326522500270054983374850973845129658305660915,
        28034035305707963547093327110582394283920526326883215327933669381957202488237,
        67835101927061504797267889999629546147998413041540252422300881129244644115080,
        77038500041308678193056750316134029091500078767515237185085918316009128923853,
        104544454093982446733027218848029782092179398179105058587091749747719757285036,
        22185654124844698314055180464281947193548886457852406483524286412315521924078,
        11843198404908081669891232877866372505664551940087258443425983951700839758573,
        75730223139679823188252090137101366517592105358927914928435294176125136703785,
        63037111269339665253951994986804650300724512054442194752074821492998493619346,
        100222574878814648498017222491060355999208577101797160841662251588925373209270,
        16506531590690913941192929825193131037149846497963759319950973398493215082721,
        25870657958016487342382077423324595640085963189536902617468804520968505489214,
        3776681458614062867704305576886405923644290248776498775782616919101874199765,
        28467337724409730306364372414422354542968529509867349778522341896421740722671,
        66613445942499043245107522483384164860482134785917043209657158812816523619396,
        8730377214678666664395213446285196951160996012879518134438322009847352589864,
        71182301344205212203724160442778867079219260050250374209369439265688715521804
    ];

    function MiMC5Feisel(uint256 iL, uint256 iR, uint256 k) public view returns (uint256, uint256) {
        uint256 nRounds = 20;

        uint256 lastL;
        uint256 lastR;

        lastL = iL;
        lastR = iR;

        uint256 base;
        uint256 base2;
        uint256 base4;
        uint256 temp;

        for (uint256 i; i < nRounds; i++) {
            base = addmod(addmod(lastR, k, p), c[i], p);
            base2 = mulmod(base, base, p);
            base4 = mulmod(base2, base2, p);
            temp = lastR;
            lastR = addmod(lastL, mulmod(base, base4, p), p);
            lastL = temp;
        }

        return (lastL, lastR);
    }

    function MiMC5Sponge(uint256[] memory elements, uint256 k) public view returns (uint256) {
        uint256 lastR;
        uint256 lastC;

        uint256 length = elements.length;
        for (uint256 i; i < length; i++) {
            (lastR, lastC) = MiMC5Feisel(addmod(lastR, elements[i], p), lastC, k);
        }

        return lastR;
    }
}