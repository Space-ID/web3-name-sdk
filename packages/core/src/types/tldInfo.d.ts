import { GetContractReturnType, HttpTransport, PublicClient } from 'viem'
import { VerifiedTldHubAbi } from '../abi/VerifiedTldHub'

export interface TldInfo {
  tld: string
  identifier: bigint
  chainId: bigint
  registry: `0x${string}`
  defaultRpc: string
  sann: `0x${string}`
}

export type HubContract = GetContractReturnType<typeof VerifiedTldHubAbi, PublicClient<HttpTransport>>
