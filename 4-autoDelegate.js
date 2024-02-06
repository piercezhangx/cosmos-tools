import { createRequire } from "module";
const require = createRequire(import.meta.url);
require('dotenv').config();
import { SigningStargateClient } from "@cosmjs/stargate";
import { Secp256k1HdWallet } from '@cosmjs/launchpad';
import { chainMap } from "./utils/chains.js";
import { sleep, DELAY_1, DELAY_HOUR, getQueryClient, delegate, withdrawRewards } from "./5-utils.js";

function getCurrentTime() {
    const dateObject = new Date();
    const date = (`0 ${dateObject.getDate()}`).slice(-2);
    // current month
    const month = (`0 ${dateObject.getMonth()+1}`).slice(-2);
    // current year
    const year = dateObject.getFullYear();
    // current hours
    const hours = dateObject.getHours();
    const minutes = dateObject.getMinutes();
    const seconds = dateObject.getSeconds();
    // prints date & time in YYYY-MM-DD HH:MM:SS format
    let current_time = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    return current_time;
}

async function start(chain) {
    const rpcEndpoint = chain.rpc;
    let wallets = [];
    if (process.env.MNEMONIC1) {
        const wallet = await Secp256k1HdWallet.fromMnemonic(
            process.env.MNEMONIC1,
            {
                prefix:chain.prefix
            }
        );
        wallets.push(wallet);
    }
    if (process.env.MNEMONIC2) {
        const wallet = await Secp256k1HdWallet.fromMnemonic(
            process.env.MNEMONIC2,
            {
                prefix:chain.prefix
            }
        );
        wallets.push(wallet);
    }
    const queryClient = await getQueryClient(rpcEndpoint);
    while (true) {
        for (let wallet of wallets) {
            const [account] = await wallet.getAccounts();
            console.log(`[${getCurrentTime()}] Account address: ${account.address}`);
            let rewards = await queryClient.distribution.delegationTotalRewards(account.address);
            let validators = [];
            let totalRewards = 0;
            for (let reward of rewards.rewards) {
                validators.push(reward.validatorAddress);
                totalRewards += Number(reward.reward[0].amount) / 1e24;
            }
            if (totalRewards > process.env.REWARDS) {
                console.log(`[${getCurrentTime()}] Claim rewards: ${totalRewards}`);
                console.log(`Sleep one second zzz`);
                await sleep(DELAY_1);
                const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
                await withdrawRewards(client, account.address, validators, chain);
                console.log(`Sleep one second zzz`);
                await sleep(DELAY_1);
                let balance = await queryClient.bank.balance(account.address, chain.denom);
                let amount = parseInt(balance.amount / 1e6);
                console.log(`[${getCurrentTime()}] Your account has ${amount} ${chain.symbol}`);
                if (amount >= process.env.REWARDS) {
                    let delegate_amount = (amount) * 1e6;
                    console.log(`[${getCurrentTime()}] Prepare to delegate ${delegate_amount} ${chain.symbol}`);
                    await delegate(client,account.address, validators, delegate_amount, chain);
                }
            } else {
                console.log(`[${getCurrentTime()}] Reward ${totalRewards} < ${process.env.REWARDS} nothing to do`);
            }
            console.log(`Sleep one second go to next wallet`);
            await sleep(DELAY_1);
        }
        console.log(`Sleep two hours zzz`);
        await sleep(DELAY_HOUR * 2);
    }
}
// select the chain here what you want
start(chainMap['unicorn-420']);
