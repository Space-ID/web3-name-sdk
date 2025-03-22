// @ts-ignore
import { getInjectiveIDAddress,  InjectiveID } from '@siddomains/injective-sidjs'
// @ts-ignore
import InjectiveID from '@siddomains/injective-sidjs'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'
import { ChainId } from '@injectivelabs/ts-types'
export class InjName {
  private timeout?: number

  constructor({ timeout }: { timeout?: number } = {}) {
    this.timeout = timeout
  }


  private async withTimeout<T>(operation: () => Promise<T>, timeoutMs?: number): Promise<T> {
    const effectiveTimeout = timeoutMs !== undefined ? timeoutMs : this.timeout

    if (!effectiveTimeout) {
      return operation()
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout)

    try {
      return await Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Operation timed out after ${effectiveTimeout}ms`))
          }, effectiveTimeout)
        }),
      ])
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getDomainName({ address, timeout }: { address: string; timeout?: number }) {
    return this.withTimeout(async () => {
      try {
        const endpoints = getNetworkEndpoints(Network.Mainnet)
        // @ts-ignore
        // const siddomains = await import('@siddomains/injective-sidjs')
        // const InjectiveID = siddomains.default
        console.log(InjectiveID,typeof InjectiveID,'InjectiveID')
        const injectiveId = new InjectiveID({
          grpc: endpoints.grpc,
          chainId: ChainId.Mainnet,
          injectiveIdAddress: getInjectiveIDAddress(ChainId.Mainnet),
        })

        const name = await injectiveId.getName(address)
        return name
      } catch (error) {
        console.error('Error getting INJ domain name', error)
        return null
      }
    }, timeout)
  }

  async getAddress({ name, timeout }: { name: string; timeout?: number }) {
    return this.withTimeout(async () => {
      try {
        const endpoints = getNetworkEndpoints(Network.Mainnet)
        // @ts-ignore
        // const siddomains = await import('@siddomains/injective-sidjs')
        // const InjectiveID = siddomains.default
        console.log(InjectiveID,typeof InjectiveID,'InjectiveID2')
        const injectiveId = new InjectiveID({
          grpc: endpoints.grpc,
          chainId: ChainId.Mainnet,
          injectiveIdAddress: getInjectiveIDAddress(ChainId.Mainnet),
        })
        const address = await injectiveId.name(name).getAddress()
        return address
      } catch (error) {
        console.error('Error getting INJ address', error)
        return null
      }
    }, timeout)
  }
}
