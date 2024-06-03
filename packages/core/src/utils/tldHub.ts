import { defaultMainnetRpc } from '../constants/tld'
import { HubContract, TldInfo } from '../types/tldInfo'
import { createPublicClient, getContract, http } from 'viem'
import { bscTestnet, mainnet } from 'viem/chains'
import { CONTRACTS } from '../constants/contracts'
import { VerifiedTldHubAbi } from '../abi/VerifiedTldHub'

const chainTldsCacheTime = 60 * 60 * 1000


class TldHub {
  private readonly isDev: boolean
  private readonly rpcUrl?: string
  private hubContract: HubContract
  private tldInfoCache = new Map<string, TldInfo>()
  private chainTldsCache = new Map<number, {
    timestamp: number
    tlds: readonly string[]
  }>()

  constructor(isDev: boolean, rpcUrl?: string) {
    this.isDev = isDev
    this.rpcUrl = rpcUrl ?? defaultMainnetRpc
    this.hubContract = this.getVerifiedTldHubContract()
  }

  /** Get verified TLD hub contract */
  private getVerifiedTldHubContract(): HubContract {
    const ethClient = createPublicClient({
      chain: this.isDev ? bscTestnet : mainnet,
      transport: http(this.isDev ? undefined : this.rpcUrl),
    })

    return getContract({
      address: this.isDev ? CONTRACTS.verifiedTldHubTest : CONTRACTS.verifiedTldHub,
      abi: VerifiedTldHubAbi,
      publicClient: ethClient,
    })
  }

  private async queryAllTldInfo() {
    const allTlds = await this.hubContract.read.getTlds()
    const res = await this.hubContract.read.getTldInfo([allTlds])
    this.tldInfoCache.clear()
    res.forEach((tldInfo) => {
      this.tldInfoCache.set(tldInfo.tld, tldInfo)
    })
  }

  private getTldInfoFromCache(tldList: string[]) {
    let res: TldInfo[] = []
    for (let tld of tldList) {
      const info = this.tldInfoCache.get(tld)
      if (info) {
        res.push(info)
      }
    }
    return res
  }

  async getTldInfo(tldList: string[]) {
    let res: TldInfo[] = this.getTldInfoFromCache(tldList)
    if (res.length === tldList.length) {
      return res
    }
    await this.queryAllTldInfo()
    res = this.getTldInfoFromCache(tldList)
    if (res.length < tldList.length) {
      const tmp = tldList.find((tld) => {
        return !this.tldInfoCache.has(tld)
      })
      if (tmp) {
        throw new Error(`TLD info not found: ${tmp}`)
      }
    }
    return res
  }

  async getChainTlds(chainId: number) {
    const tmp = this.chainTldsCache.get(chainId)
    if (!tmp || Date.now() - tmp.timestamp > chainTldsCacheTime) {
      const tlds = await this.hubContract.read.getChainTlds([BigInt(chainId)])
      this.chainTldsCache.set(chainId, {
        timestamp: Date.now(),
        tlds,
      })
      return tlds
    }
    return tmp.tlds
  }
}

export {
  TldHub,
}
