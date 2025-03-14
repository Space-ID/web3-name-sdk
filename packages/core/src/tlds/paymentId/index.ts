import { createPublicClient, hexToBigInt, hexToString, http, keccak256, stringToHex } from "viem"
import { paymentIdReaderAbi } from "../../abi/paymentId/paymentIdReader"
import { PaymentIdTld, PaymentIdTldCode } from "../../constants/tld"
// import { base } from "viem/chains"
export const BaseTestChain = {
    id: 84532,
    name: 'Base Sepolia Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://sepolia.base.org/'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Basescan',
            url: 'https://sepolia.basescan.org',
        },
    },
}

function getTokenIdBigint(domainName: string) {
    const nameHash = keccak256(stringToHex(domainName.split('@')[0]))
    return hexToBigInt(nameHash)
}

function getTldCode(domainName: string): bigint {
    console.log('domain', domainName)
    const parts = domainName.split('@')
    const tld = parts[1] as PaymentIdTld
    return BigInt(PaymentIdTldCode[tld])
}

export class PaymentIdName {
    private client = createPublicClient({
        chain: BaseTestChain,
        transport: http('https://sepolia.base.org/'),
    })

    async getAddress({ name, chainId }: { name: string, chainId: number }) {
        try {
            const address = await this.client.readContract({
                address: '0xcd8E5A0023Cb750B89898BdAf776e26138E76E33',
                abi: paymentIdReaderAbi,
                functionName: 'addr',
                args: [getTokenIdBigint(name), getTldCode(name), BigInt(chainId)]

            })
            console.log('address', address, 'hex', hexToString(address))
            return chainId === 1 ? address : hexToString(address)
        }
        catch (error) {
            console.error('Error getting PaymentId address', error)
            return null
        }
    }
}