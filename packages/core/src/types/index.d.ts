import { Address, Client, PublicClient } from 'viem'

export interface DomainResolver {
  getDomainName(address: string, reverseNamehash: Hash, tld: TldInfo, rpcUrl?: string): Promise<string | null>
}

export type GetDomainNameProps = {
  queryChainIdList?: number[]
  queryTldList?: string[]
  address: string
  rpcUrl?: string
  queryTld?: string
  queryChainId?: number
}

export type BatchGetDomainNameProps = {
  addressList: Address[]
  client: any
  queryChainIdList?: number[]
  queryTldList?: string[]
}
export type BatchGetDomainNameReturn = { address: Address; domain: string | null }[]
