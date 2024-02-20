import {
  Address,
  createPublicClient,
  getContract,
  getFunctionSelector,
  hexToBigInt,
  hexToNumber,
  http,
  keccak256,
  type GetContractReturnType,
  type HttpTransport,
  type PublicClient,
} from 'viem'
import { bscTestnet, mainnet } from 'viem/chains'
import { ResolverAbi } from '../abi/Resolver'
import { ReverseResolverAbi } from '../abi/ReverseResolver'
import { SANNContractAbi } from '../abi/SANN'
import { SIDRegistryAbi } from '../abi/SIDRegistry'
import { TldBaseContractAbi } from '../abi/TldBase'
import { VerifiedTldHubAbi } from '../abi/VerifiedTldHub'
import { CONTRACTS } from '../constants/contracts'
import { TldInfo } from '../types/tldInfo'
import { createCustomClient, getBaseContractFromChainId } from './common'

export class ContractReader {
  private isDev: boolean

  constructor(isDev: boolean) {
    this.isDev = isDev
  }

  /** Get verified TLD hub contract */
  getVerifiedTldHubContract(): GetContractReturnType<typeof VerifiedTldHubAbi, PublicClient<HttpTransport>> {
    const ethClient = createPublicClient({
      chain: this.isDev ? bscTestnet : mainnet,
      transport: http(this.isDev ? undefined : 'https://rpc.ankr.com/eth'),
    })

    const hubContract = getContract({
      address: this.isDev ? CONTRACTS.verifiedTldHubTest : CONTRACTS.verifiedTldHub,
      abi: VerifiedTldHubAbi,
      publicClient: ethClient,
    })

    return hubContract
  }

  async getTldInfo(tldList: string[]) {
    const hubContract = this.getVerifiedTldHubContract()
    const tldInfoList = await hubContract.read.getTldInfo([tldList])
    return tldInfoList.filter((e) => !!e.tld)
  }

  /**
   * Get resolver contract by TLD
   *
   * @export
   * @param {string} domain
   * @param {TldInfo} tldInfo
   * @param {string} [rpcUrl]
   * @return {*}
   */
  async getResolverContractByTld(
    namehash: Address,
    tldInfo: TldInfo,
    rpcUrl?: string
  ): Promise<GetContractReturnType<typeof ResolverAbi, PublicClient<HttpTransport>>> {
    const client = createCustomClient(tldInfo, rpcUrl)
    const registryContract = getContract({
      address: tldInfo.registry,
      abi: SIDRegistryAbi,
      publicClient: client,
    })

    const resolverAddr = await registryContract.read.resolver([namehash])
    if (!hexToNumber(resolverAddr)) {
      throw 'resolver address is null'
    }

    const resolverContract = getContract({
      address: resolverAddr,
      abi: ResolverAbi,
      publicClient: client,
    })
    return resolverContract
  }

  /** Get reverse resolver contract (V2 only) */
  async getReverseResolverContract(
    reverseNamehash: Address,
    tldInfo: TldInfo,
    rpcUrl?: string
  ): Promise<GetContractReturnType<typeof ReverseResolverAbi, PublicClient<HttpTransport>> | undefined> {
    if (!tldInfo.defaultRpc) return undefined
    const client = createCustomClient(tldInfo, rpcUrl)
    const registryContract = getContract({
      address: tldInfo.registry,
      abi: SIDRegistryAbi,
      publicClient: client,
    })
    const resolverAddr = await registryContract.read.resolver([reverseNamehash])
    const resolverContract = getContract({
      address: resolverAddr ?? '',
      abi: ReverseResolverAbi,
      publicClient: client,
    })

    return resolverContract
  }

  async getTldMetadata(domain: string, tldInfo: TldInfo, rpcUrl?: string) {
    const tokenId = hexToBigInt(keccak256(Buffer.from(domain.split('.')[0])))

    const client = createCustomClient(tldInfo, rpcUrl)
    const sannContract = getContract({
      address: tldInfo.sann,
      abi: SANNContractAbi,
      publicClient: client,
    })

    const tldBaseContractAddr =
      tldInfo.identifier === BigInt(0)
        ? getBaseContractFromChainId(Number(tldInfo.chainId))
        : await sannContract.read.tldBase([BigInt(`${tldInfo.identifier}`)])

    if (tldInfo.chainId === BigInt(mainnet.id)) {
      return `https://metadata.ens.domains/mainnet/${tldBaseContractAddr}/${tokenId}`
    }

    const tldBaseContract = getContract({ address: tldBaseContractAddr, abi: TldBaseContractAbi, publicClient: client })
    const metadata = await tldBaseContract.read.tokenURI([tokenId])
    return metadata
  }

  // Read content hash from resolver contract
  async getContenthash(namehash: Address, tldInfo: TldInfo, rpcUrl?: string) {
    const resolver = await this.getResolverContractByTld(namehash, tldInfo, rpcUrl)
    const functionExists = await this.resolverFunctionExists(resolver.address, 'contenthash(bytes32)', tldInfo, rpcUrl)
    if (!functionExists) return undefined
    const contentHash = await resolver.read.contenthash([namehash])
    return contentHash
  }

  // Read content hash from resolver contract
  async getABI(namehash: Address, tldInfo: TldInfo, rpcUrl?: string) {
    const resolver = await this.getResolverContractByTld(namehash, tldInfo, rpcUrl)
    const functionExists = await this.resolverFunctionExists(resolver.address, 'ABI(bytes32, uint256)', tldInfo, rpcUrl)
    if (!functionExists) return undefined
    const contentHash = await resolver.read.ABI([namehash, BigInt(1)])
    return contentHash
  }

  async containsTldNameFunction(resolverAddr: Address, tldInfo: TldInfo, rpcUrl?: string): Promise<boolean> {
    const client = createCustomClient(tldInfo, rpcUrl)
    const bytecode = await client.getBytecode({ address: resolverAddr })
    const selector = getFunctionSelector('tldName(bytes32, uint256)')
    return bytecode?.includes(selector.slice(2)) ?? false
  }

  async resolverFunctionExists(
    resolverAddr: Address,
    functionName: string,
    tldInfo: TldInfo,
    rpcUrl?: string
  ): Promise<boolean> {
    const client = createCustomClient(tldInfo, rpcUrl)
    const bytecode = await client.getBytecode({ address: resolverAddr })
    const selector = getFunctionSelector(functionName)
    return bytecode?.includes(selector.slice(2)) ?? false
  }
}
