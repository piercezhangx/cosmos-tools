import {
    QueryClient, setupBankExtension, setupDistributionExtension,SigningStargateClient
} from "@cosmjs/stargate";
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { coin,coins, Secp256k1HdWallet } from '@cosmjs/launchpad';

const MODE=1;

export const DELAY_HALF_SEC = '500'; //sleep half second
export const DELAY_1 = '1000'; //sleep 1 seconds
export const DELAY_3 = '3000'; //sleep 3 seconds
export const DELAY_MINUTE = '60000'; //sleep 1 minute
export const DELAY_TWO_MINUTES = '120000'; //sleep 2 minute
export const DELAY_TEN_MINUTES = '600000'; // sleep 10 minutes
export const DELAY_HALF_HOUR = '1800000'; // sleep 30 minutes
export const DELAY_HOUR = '3600000'; // sleep a hour

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getQueryClient(rpcEndpoint) {
    const tendermint34Client = await Tendermint34Client.connect(rpcEndpoint);
    const queryClient = QueryClient.withExtensions(
        tendermint34Client,
        setupBankExtension,
        setupDistributionExtension
    );
    return queryClient;
}

export async function delegate(client, address, validators, amount,chain) {
    let ops=[];
    ops.push({
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value: {
            delegatorAddress: address,
            validatorAddress: validators[0],
            amount: coin(amount, chain.denom)
        },
    });
    const fee = {
        amount: coins(chain.min_tx_fee[MODE], chain.denom),
        gas: "" + chain.gas,
    };
    let result = await client.signAndBroadcast(address, ops, fee, '');
    console.log("Broadcasting result:", result);
}

export async function withdrawRewards(client, address, validators, chain) {
    let ops = [];
    for (let validator of validators) {
        let msg = {
            typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            value: {
                delegatorAddress: address,
                validatorAddress: validator
            },
        };
        ops.push(msg);
    }
    const fee = {
        amount: coins(812, chain.denom),
        gas: "162370",
    };
    let result = await client.signAndBroadcast(address, ops, fee, '');
    console.log("Broadcasting result:", result);
}

