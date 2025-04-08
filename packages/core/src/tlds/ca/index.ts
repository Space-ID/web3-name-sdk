import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from '@coral-xyz/anchor'
import { Program } from "@coral-xyz/anchor";
import idl from "../../abi/ca/ca_registrar.json";

const PROGRAM_ID = new PublicKey("DJSovpN5v7g3Hqw89oT7AmaRMp4RTPJ1v1UUxQM86hut");

export class CaName {
    private program: Program;

    constructor(rpcUrl?: string) {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        //@ts-ignore
        this.program = new Program(idl, { connection });
    }


    async getAddress({ name, chainId }: { name: string; chainId: number }) {
        const DOMAIN_RECORD_SEED = Buffer.from("domain");

        const [domainRecordAccount] = anchor.web3.PublicKey.findProgramAddressSync(
            [DOMAIN_RECORD_SEED, Buffer.from(name)],
            PROGRAM_ID
        );
        console.log('domainRecordAccount', domainRecordAccount);
        //@ts-ignore
        const record = await this.program.account.domainRecord.fetch(domainRecordAccount);
        console.log("Domain Record Account: ", record);
        return record.addresses[0]?.address;
    }
}