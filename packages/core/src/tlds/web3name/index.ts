import { Address, createPublicClient, getContract, Hash, http, namehash } from 'viem'
import { normalize } from 'viem/ens'
import { TLD } from '../../constants/tld'
import { createCustomClient, getChainFromId, isEthChain, isV2Tld } from '../../utils/common'
import { ContractReader } from '../../utils/contract'
import { tldNamehash } from '../../utils'
import { validateName } from '../../utils'
import { UDResolver } from '../UD'
import { LensProtocol } from '../lens'
import { TldInfo } from '../../types/tldInfo'
import { BatchGetAddressProps, BatchGetDomainNameProps, BatchGetReturn, GetDomainNameProps } from '../../types'
import { SIDRegistryAbi } from '../../abi/SIDRegistry'
import { ResolverAbi } from '../../abi/Resolver'
import { ReverseResolverAbi } from '../../abi/ReverseResolver'

export class Web3Name {
  private contractReader: ContractReader
  private resolverContractCache: Map<string, any> = new Map()
  private tldNameFunctionCache = new Map<string, any>()

  constructor({ isDev = false, rpcUrl }: { isDev?: boolean; rpcUrl?: string } = {}) {
    this.contractReader = new ContractReader(isDev, rpcUrl)
  }

  private async getTldInfoList({ queryTldList, queryChainIdList }: Omit<GetDomainNameProps, 'address'>) {
    const hubContract = this.contractReader.getVerifiedTldHubContract()
    const chainTlds: string[] = []
    for await (const chainId of queryChainIdList ?? []) {
      const tlds = await hubContract.read.getChainTlds([BigInt(chainId)])

      if (isEthChain(chainId)) {
        // Put ENS at the end of the list
        const ethTld = tlds.filter((e) => e !== TLD.ENS).at(0)
        if (ethTld) chainTlds.push(ethTld)
        chainTlds.push(TLD.ENS)
      } else {
        const tldName = tlds.at(0)
        if (tldName) chainTlds.push(tldName)
      }
    }

    const tlds = queryTldList ?? []
    // Fetch all TLDs if no TLDs are specified
    if (tlds.length === 0) {
      const allTlds = await hubContract.read.getTlds()
      tlds.push(...allTlds)
    }

    // Use chain TLDs if queryChainIdList is specified
    const reqTlds = queryChainIdList?.length ? chainTlds : tlds
    return await this.contractReader.getTldInfo(reqTlds)
  }

  private async getResolverContract(tld: TldInfo, reverseNamehash: Hash, rpcUrl?: string) {
    return tld.tld === TLD.ENS
      ? await this.contractReader.getReverseResolverContract(reverseNamehash, tld, rpcUrl)
      : await this.contractReader.getResolverContractByTld(reverseNamehash, tld, rpcUrl)
  }

  private async isHasTldNameFunction(address: Address, tld: TldInfo, reverseNamehash: Hash) {
    let containsTldNameFunction
    if (this.resolverContractCache.has(`${address}_${tld.tld}`)) {
      containsTldNameFunction = this.resolverContractCache.get(`${address}_${tld.tld}`)
    } else {
      containsTldNameFunction = await this.contractReader.containsTldNameFunction(address, tld)
      this.resolverContractCache.set(`${address}_${tld.tld}`, containsTldNameFunction)
    }
    const res = {
      functionName: containsTldNameFunction ? 'tldName' : 'name',
      args: containsTldNameFunction ? [reverseNamehash, tld.identifier] : [reverseNamehash],
    }
    return res
  }

  private async getDomainNameByTld(
    address: string,
    reverseNamehash: Hash,
    tld: TldInfo,
    isTldName: boolean,
    rpcUrl?: string
  ) {
    let name: string | null = null

    try {
      if (tld.tld === TLD.ENS) {
        const contract = await this.contractReader.getReverseResolverContract(reverseNamehash, tld, rpcUrl)
        name = (await contract?.read.name([reverseNamehash])) ?? ''
      } else {
        const contract = await this.contractReader.getResolverContractByTld(reverseNamehash, tld, rpcUrl)
        if (isTldName) {
          if (isV2Tld(tld.tld)) {
            const containsTldNameFunction = await this.contractReader.containsTldNameFunction(
              contract.address,
              tld,
              rpcUrl
            )
            if (containsTldNameFunction) {
              name = await contract.read.tldName([reverseNamehash, tld.identifier])
            } else {
              name = await contract.read.name([reverseNamehash])
            }
            // if (!containsTldNameFunction) throw 'TLD name is not supported for this TLD'
          } else {
            name = await contract.read.tldName([reverseNamehash, tld.identifier])
          }
        } else {
          name = await contract.read.name([reverseNamehash])
        }
      }
    } catch (error) {
      // console.error(`Error getting name for ${address} from ${tld.tld}`, error)
    }

    if (name) {
      const reverseAddress = await this.getAddress(name, { rpcUrl })
      if (reverseAddress?.toLowerCase() === address.toLowerCase()) {
        return name
      } else {
        return null
      }
    }
    return name
  }

  /**
   * Get domain name from address.
   * If queryChainIdList is specified, it will return domain name from that chain.
   * If queryTldList is specified, it will return domain name from that TLDs with the order.
   * If neither is specified, it will return domain name from all TLDs.
   * It's not recommended to use queryChainIdList and queryTldList together.
   *
   * @param {GetDomainNameProps} { address, queryChainIdList, queryTldList }
   * @return {*}  {(Promise<string | null>)}
   * @memberof Web3Name
   */
  async getDomainName({ address, queryChainIdList, queryTldList, rpcUrl }: GetDomainNameProps): Promise<string | null> {
    if (queryChainIdList?.length && queryTldList?.length) {
      console.warn('queryChainIdList and queryTldList cannot be used together, queryTldList will be ignored')
    }

    try {
      // Calculate reverse node and namehash
      const reverseNode = `${normalize(address).slice(2)}.addr.reverse`
      const reverseNamehash = namehash(reverseNode)

      // Fetch TLDs from requested chains
      const tldInfoList = await this.getTldInfoList({ queryChainIdList, queryTldList, rpcUrl })

      const resList: (string | null)[] = []
      for await (const tld of tldInfoList) {
        if (!tld.tld) continue
        const isTldName = !!queryTldList?.length
        let name = await this.getDomainNameByTld(address, reverseNamehash, tld, isTldName, rpcUrl)
        if (name) {
          resList.push(name)
          break
        }
      }

      if (queryTldList?.includes(TLD.LENS)) {
        const lensName = await LensProtocol.getDomainName(address)
        if (lensName) resList.push(lensName)
      } else if (queryTldList?.includes(TLD.CRYPTO)) {
        const UD = new UDResolver()
        const udName = await UD.getName(address)
        if (udName) resList.push(udName)
      }

      return resList.at(0) ?? null
    } catch (e) {
      console.log(`Error getting name for reverse record of ${address}`, e)
      return null
    }
  }

  async batchGetDomainName({
    addressList,
    queryTld,
    queryChainId,
  }: BatchGetDomainNameProps): Promise<BatchGetReturn | null> {
    if (queryChainId && queryTld) {
      console.warn('queryChainId and queryTld cannot be used together, queryTld will be ignored')
    }
    if (!addressList.length) return []
    const tldInfoList = await this.getTldInfoList({ queryChainId, queryTld })
    const tldInfo = tldInfoList.find((tld) => (queryTld ? tld.tld === queryTld : tld.chainId === BigInt(queryChainId!)))
    if (!tldInfo) {
      console.log(`queryChainId or queryTld need to be`)
      return []
    }
    const client = createCustomClient(tldInfo)
    try {
      // addr to Hash
      const reverseAddress = addressList.map((address) => {
        const reverseNode = `${normalize(address).slice(2)}.addr.reverse`
        const reverseNamehash = namehash(reverseNode)
        return {
          reverseNamehash,
        }
      })
      // get resolver contract by multicall
      const resolverContractCalls = reverseAddress.map(({ reverseNamehash }) => {
        return {
          address: tldInfo.registry,
          abi: SIDRegistryAbi,
          functionName: 'resolver',
          args: [reverseNamehash],
        }
      })
      const resolverAddrCallRes = (
        await client.multicall({
          contracts: resolverContractCalls,
        })
      ).map((v: any) => v.result)
      const resolverContracts = resolverAddrCallRes.map((item, index) => {
        const contract = getContract({
          address: item,
          abi: ResolverAbi,
          client: {
            public: client,
          },
        })
        return {
          ...contract,
          reverseNamehash: reverseAddress[index].reverseNamehash,
        }
      })
      // get tld name function to resolve
      const tldNameFunctionResults: {
        functionName: string
        reverseNamehash: `0x${string}`
        args: (bigint | `0x${string}`)[]
      }[] = []
      for (const { address, reverseNamehash } of resolverContracts) {
        const cacheKey = `${address}_${reverseNamehash}`
        if (this.tldNameFunctionCache.has(cacheKey)) {
          tldNameFunctionResults.push({
            ...this.tldNameFunctionCache.get(cacheKey),
            reverseNamehash,
          })
        } else {
          const data = await this.isHasTldNameFunction(address, tldInfo, reverseNamehash)
          this.tldNameFunctionCache.set(cacheKey, data)
          tldNameFunctionResults.push({
            ...data,
            reverseNamehash,
          })
        }
      }
      // batch get results
      const calls = resolverContracts.map(({ address, abi, reverseNamehash }) => {
        const { functionName, args } = tldNameFunctionResults.find((item) => item.reverseNamehash === reverseNamehash)!
        return {
          address,
          abi,
          functionName,
          args,
        }
      })
      const domainRes = (
        await client.multicall({
          contracts: calls,
        })
      ).map((v: any) => v.result)
      const res: BatchGetReturn = []
      const verifiedRes = await this.batchGetAddress({ nameList: domainRes, queryTld })
      const verifiedAddress = verifiedRes?.map(({ address }) => address)
      addressList.map((address, index) => {
        if (address.toLowerCase() === verifiedAddress?.[index].toLowerCase()) {
          res.push({
            address: address,
            domain: domainRes[index],
          })
        }
      })
      return res ?? null
    } catch (e) {
      console.log(`Error getting names for addresses`, e)
      return null
    }
  }

  async batchGetAddress({ nameList, queryTld, queryChainId }: BatchGetAddressProps): Promise<BatchGetReturn | null> {
    if (queryChainId && queryTld) {
      console.warn('queryChainId and queryTld cannot be used together, queryTld will be ignored')
    }
    if (!nameList.length) return []
    const tldInfoList = await this.getTldInfoList({ queryChainId, queryTld })
    const tldInfo = tldInfoList.find((tld) => (queryTld ? tld.tld === queryTld : tld.chainId === BigInt(queryChainId!)))
    if (!tldInfo) {
      console.log(`queryChainId or queryTld need to be`)
      return []
    }
    const client = createCustomClient(tldInfo)
    try {
      const verifiedNames: string[] = nameList.map((name) => {
        const normalizedDomain = TLD.LENS === tldInfo.tld ? name : normalize(name)
        const namehash = tldNamehash(normalizedDomain, isV2Tld(tldInfo.tld) ? undefined : tldInfo.identifier)
        return namehash
      })

      const reverseContractCalls = verifiedNames.map((namehash) => {
        return {
          address: tldInfo.registry,
          abi: SIDRegistryAbi,
          functionName: 'resolver',
          args: [namehash],
        }
      })

      const reverseCallRes = (
        await client.multicall({
          contracts: reverseContractCalls,
        })
      ).map((v: any) => v.result)
      const reverseContracts = reverseCallRes.map((item, index) => {
        const contract = getContract({
          address: item,
          abi: ResolverAbi,
          client: {
            public: client,
          },
        })
        return {
          ...contract,
          namehash: verifiedNames[index],
        }
      })
      const getAddressCalls = reverseContracts.map(({ address, abi, namehash }) => {
        return {
          address,
          abi,
          functionName: 'addr',
          args: [namehash],
        }
      })
      const addresses = (
        await client.multicall({
          contracts: getAddressCalls,
        })
      ).map((v: any) => v.result)

      const res = addresses.map((address, index) => {
        return {
          address,
          domain: nameList[index],
        }
      })
      return res
    } catch (error) {
      console.log(`Error getting address for names`, error)
      return null
    }
  }

  // async batchGetDomainName({
  //   addressList,
  //   queryChainIdList,
  //   queryTldList,
  //   rpcUrl,
  // }: BatchGetDomainNameProps): Promise<BatchGetDomainNameReturn | null> {
  //   if (queryChainIdList?.length && queryTldList?.length) {
  //     console.warn('queryChainIdList and queryTldList cannot be used together, queryTldList will be ignored')
  //   }
  //   if (!addressList.length) return []
  //   let curAddr = addressList[0]
  //   try {
  //     // Fetch TLDs from requested chains
  //     const tldInfoList = await this.getTldInfoList({ queryChainIdList, queryTldList, rpcUrl })
  //     const resList: BatchGetDomainNameReturn = []
  //     const isIncludeLens = queryTldList?.includes(TLD.LENS)
  //     const isIncludeCrypto = queryTldList?.includes(TLD.CRYPTO)
  //     for await (const address of addressList) {
  //       curAddr = address
  //       // Calculate reverse node and namehash
  //       const reverseNode = `${normalize(address).slice(2)}.addr.reverse`
  //       const reverseNamehash = namehash(reverseNode)
  //       let nameRes: string | null = null
  //       for await (const tld of tldInfoList) {
  //         if (!tld.tld) continue
  //         const isTldName = !!queryTldList?.length
  //         nameRes = await this.getDomainNameByTld(address, reverseNamehash, tld, isTldName, rpcUrl)
  //         if (nameRes) {
  //           break
  //         }
  //       }
  //       if (!nameRes && isIncludeLens) {
  //         nameRes = await LensProtocol.getDomainName(address)
  //       }
  //       if (!nameRes && isIncludeCrypto) {
  //         const UD = new UDResolver()
  //         nameRes = await UD.getName(address)
  //       }
  //       resList.push({ address, domain: nameRes })
  //     }
  //     return resList
  //   } catch (e) {
  //     console.log(`Error getting name for reverse record of ${curAddr}`, e)
  //     return null
  //   }
  // }

  /**
   * Get address from name. If coinType is specified, it will return ENSIP-9 address for that coinType.
   *
   * @param {string} name
   * @param {{ coinType?: number; rpcUrl?: string }} { coinType, rpcUrl }
   * @return {*}  {(Promise<string | null>)}
   * @memberof Web3Name
   */
  async getAddress(
    name: string,
    { coinType, rpcUrl }: { coinType?: number; rpcUrl?: string } = {}
  ): Promise<string | null> {
    const tld = name.split('.').pop()?.toLowerCase()
    if (!tld) {
      return null
    }
    const normalizedDomain = TLD.LENS === tld ? name : normalize(name)

    if (tld !== TLD.ENS && tld !== TLD.LENS && tld !== TLD.CRYPTO) {
      validateName(normalizedDomain)
    }

    try {
      if (tld === TLD.ENS) {
        const tldInfoList = await this.contractReader.getTldInfo([tld])
        const publicClient = createPublicClient({
          chain: getChainFromId(Number(tldInfoList[0].chainId)),
          transport: http(),
        })
        return await publicClient.getEnsAddress({
          name: normalizedDomain,
        })
      }

      if (tld === TLD.LENS) {
        return await LensProtocol.getAddress(name)
      }

      if (tld === TLD.CRYPTO) {
        const UD = new UDResolver()
        return await UD.getAddress(name)
      }

      // Get TLD info from verified TLD hub
      const tldInfoList = await this.contractReader.getTldInfo([tld])
      const tldInfo = tldInfoList.at(0)
      if (!tldInfo) {
        throw 'TLD not found'
      }

      const namehash = tldNamehash(normalizedDomain, isV2Tld(tld) ? undefined : tldInfo.identifier)
      // Get resolver contract from registry contract
      const resolverContract = await this.contractReader.getResolverContractByTld(namehash, tldInfo, rpcUrl)
      // Get address from resolver contract
      const res =
        coinType !== undefined
          ? await resolverContract.read.addr([namehash, BigInt(coinType)])
          : await resolverContract.read.addr([namehash])
      return res
    } catch (error) {
      console.error(`Error getting address for ${name}`, error)
      return null
    }
  }

  /**
   * Get available domain list from address.
   *
   * @param {GetDomainNameProps} { address, queryChainIdList, queryTldList }
   * @return {*}  {Promise<string[]>}
   * @memberof Web3Name
   */
  async getDomainNames({ address, queryChainIdList, queryTldList, rpcUrl }: GetDomainNameProps): Promise<string[]> {
    if (queryChainIdList?.length && queryTldList?.length) {
      console.warn('queryChainIdList and queryTldList cannot be used together, queryTldList will be ignored')
    }

    const resList: Set<string> = new Set([])
    try {
      // Calculate reverse node and namehash
      const reverseNode = `${address.toLowerCase().slice(2)}.addr.reverse`
      const reverseNamehash = namehash(reverseNode)

      const hubContract = this.contractReader.getVerifiedTldHubContract()

      // Fetch TLDs from requested chains
      const chainTlds: string[] = []
      for (const chainId of queryChainIdList ?? []) {
        const tlds = await hubContract.read.getChainTlds([BigInt(chainId)])

        if (isEthChain(chainId)) {
          // Put ENS at the end of the list
          const ethTld = tlds.filter((e) => e !== TLD.ENS).at(0)
          if (ethTld) chainTlds.push(ethTld)
          chainTlds.push(TLD.ENS)
        } else {
          const tldName = tlds.at(0)
          if (tldName) chainTlds.push(tldName)
        }
      }

      const tlds = queryTldList ?? []
      // Fetch all TLDs if no TLDs are specified
      if (tlds.length === 0) {
        const allTlds = await hubContract.read.getTlds()
        tlds.push(...allTlds)
      }

      // If queryChainIdList is specified, only fetch TLDs from those chains
      const reqTlds = queryChainIdList?.length ? chainTlds : tlds
      const tldInfoList = await this.contractReader.getTldInfo(reqTlds)

      for (const tld of tldInfoList) {
        if (!tld.tld) continue
        let name = ''
        try {
          if (tld.tld === TLD.ENS) {
            const contract = await this.contractReader.getReverseResolverContract(reverseNamehash, tld, rpcUrl)
            name = (await contract?.read.name([reverseNamehash])) ?? ''
          } else {
            const contract = await this.contractReader.getResolverContractByTld(reverseNamehash, tld)
            if (queryTldList?.length) {
              if (isV2Tld(tld.tld)) {
                const containsTldNameFunction = await this.contractReader.containsTldNameFunction(contract.address, tld)
                if (!containsTldNameFunction) throw 'TLD name is not supported for this TLD'
              }
              name = await contract.read.tldName([reverseNamehash, tld.identifier])
            } else {
              name = await contract.read.name([reverseNamehash])
            }
          }
        } catch (error) {
          continue
        }

        if (name) {
          const reverseAddress = await this.getAddress(name, { rpcUrl })
          if (reverseAddress === address) {
            resList.add(name)
          }
        }
      }

      if (queryTldList?.includes(TLD.LENS)) {
        const lensName = await LensProtocol.getDomainName(address)
        if (lensName) resList.add(lensName)
      } else if (queryTldList?.includes(TLD.CRYPTO)) {
        const UD = new UDResolver()
        const name = await UD.getName(address)
        name && resList.add(name)
      }

      return Array.from(resList)
    } catch (e) {
      console.log(`Error getting name for reverse record of ${address}`, e)
      return []
    }
  }

  /**
   * Get domain record from name and key.
   *
   * @param {{ name: string; key: string; rpcUrl?: string }} { name, key, rpcUrl }
   * @return {*}
   * @memberof Web3Name
   */
  async getDomainRecord({ name, key, rpcUrl }: { name: string; key: string; rpcUrl?: string }) {
    const tld = name.split('.').pop()?.toLowerCase()
    if (!tld) {
      return null
    }

    try {
      const normalizedDomain = TLD.LENS === tld ? name : normalize(name)

      const tldInfoList = await this.contractReader.getTldInfo([tld])
      const tldInfo = tldInfoList[0]
      if (!tldInfo) {
        throw 'TLD not found'
      }

      const namehash = tldNamehash(normalizedDomain, isV2Tld(tld) ? undefined : tldInfo.identifier)
      // Get resolver contract from registry contract
      const resolverContract = await this.contractReader.getResolverContractByTld(namehash, tldInfo, rpcUrl)
      const record = await resolverContract.read.text([namehash, key])
      return record
    } catch (error) {
      console.error(`Error getting address for ${name}`, error)
      return null
    }
  }

  /**
   * Get domain metadata from name.
   *
   * @param {{ name: string; rpcUrl?: string }} { name, rpcUrl }
   * @return {*}
   * @memberof Web3Name
   */
  async getMetadata({ name, rpcUrl }: { name: string; rpcUrl?: string }) {
    const tld = name.split('.').pop()?.toLowerCase()
    if (!tld) {
      return null
    }
    try {
      const tldInfo = await this.contractReader.getTldInfo([tld])
      if (!tldInfo || !tldInfo.at(0)?.sann) {
        return null
      }

      const metadata = await this.contractReader.getTldMetadata(name, tldInfo[0], rpcUrl)
      const res = await fetch(metadata).then((res) => res.json())
      return res
    } catch (error) {
      console.error(`Error getting metadata for ${name}`, error)
    }
  }

  /**
   * Get domain avatar from name.
   *
   * @param {{ name: string; key: string; rpcUrl?: string }} { name, rpcUrl }
   * @return {*}
   * @memberof Web3Name
   */
  async getDomainAvatar({ name, rpcUrl }: { name: string; key: string; rpcUrl?: string }): Promise<string | undefined> {
    const metadata = await this.getMetadata({ name, rpcUrl })
    return metadata?.image
  }

  /**
   * Get domain content hash from name.
   *
   * @param {{ name: string; rpcUrl?: string }} { name, rpcUrl }
   * @return {*}  {(Promise<string | undefined>)}
   * @memberof Web3Name
   */
  async getContentHash({ name, rpcUrl }: { name: string; rpcUrl?: string }): Promise<string | undefined> {
    const tld = name.split('.').pop()?.toLowerCase()
    if (!tld) {
      return undefined
    }
    try {
      const tldInfo = (await this.contractReader.getTldInfo([tld])).at(0)
      if (!tldInfo) throw 'TLD not found'

      const namehash = tldNamehash(normalize(name), isV2Tld(tld) ? undefined : tldInfo.identifier)
      const contenthash = await this.contractReader.getContenthash(namehash, tldInfo, rpcUrl)
      if (!contenthash || contenthash === '0x') return undefined
      return contenthash
    } catch (error) {
      console.error(`Error getting content hash for ${name}`, error)
    }
  }

  /**
   * Retrieves the ABI (Application Binary Interface) for a given name on the Web3Name system.
   * @param name - The name for which to retrieve the ABI.
   * @param rpcUrl - Optional RPC URL to use for retrieving the ABI.
   * @returns The ABI for the specified name, or undefined if the TLD (Top-Level Domain) is not found.
   */
  // async getABI({ name, rpcUrl }: { name: string; rpcUrl?: string }) {
  //   const tld = name.split('.').pop()?.toLowerCase()
  //   if (!tld) {
  //     return undefined
  //   }
  //   try {
  //     const tldInfo = (await this.contractReader.getTldInfo([tld])).at(0)
  //     if (!tldInfo) throw 'TLD not found'

  //     const namehash = tldNamehash(normalize(name), isV2Tld(tld) ? undefined : tldInfo.identifier)
  //     const abi = await this.contractReader.getABI(namehash, tldInfo, rpcUrl)
  //     return abi
  //   } catch (error) {
  //     console.error(`Error getting content hash for ${name}`, error)
  //   }
  // }
}
