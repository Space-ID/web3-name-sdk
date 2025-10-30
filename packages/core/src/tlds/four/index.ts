import { Address, createPublicClient, getContract, http } from 'viem'
import { bsc } from 'viem/chains'
import { FourDomainReaderAbi } from '../../abi/FourDomainReader'

export class FourResolver {
  private contractAddress = '0xd2865AFd9684c4b04c25B2205710484b2879d8Ad' as `0x${string}`
  private timeout?: number

  constructor({ timeout }: { timeout?: number } = {}) {
    this.timeout = timeout
  }

  private async withTimeout<T>(operation: (signal?: AbortSignal) => Promise<T>, timeoutMs?: number): Promise<T> {
    const effectiveTimeout = timeoutMs !== undefined ? timeoutMs : this.timeout

    if (!effectiveTimeout) {
      return operation()
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, effectiveTimeout)

    try {
      return await operation(controller.signal)
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`Operation timed out after ${effectiveTimeout}ms`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 从域名解析到地址
   * @param domain - 完整的域名，例如 "example.four"
   * @returns 解析出的地址，如果解析失败则返回 null
   */
  async getAddress(domain: string): Promise<string | null> {
    return this.withTimeout(async (signal) => {
      try {
        // 移除 .four 后缀，只传递域名部分
        const domainName = domain.replace('.four', '')

        const client = createPublicClient({
          chain: bsc,
          transport: http(undefined, {
            fetchOptions: signal ? { signal } : undefined,
          }),
        })

        const contract = getContract({
          address: this.contractAddress,
          abi: FourDomainReaderAbi,
          client: client,
        })

        const result = await contract.read.getDomainInfo([domainName])
        if (result && typeof result === 'object') {
          const { owner, caAddress, registeredAt, exists } = result as {
            owner: string
            caAddress: string
            registeredAt: bigint
            exists: boolean
          }

          if (exists && caAddress && caAddress !== '0x0000000000000000000000000000000000000000') {
            return caAddress
          }
        }

        return null
      } catch (error) {
        console.error(`Error resolving .four domain ${domain}:`, error)
        return null
      }
    })
  }

  /**
   * 从地址反向解析到域名
   * 使用合约的 getDomainByCA 方法进行反向解析
   * @param address - 要反向解析的地址
   * @returns 域名，如果解析失败则返回 null
   */
  async getName(address: string): Promise<string | null> {
    return this.withTimeout(async (signal) => {
      try {
        const client = createPublicClient({
          chain: bsc,
          transport: http(undefined, {
            fetchOptions: signal ? { signal } : undefined,
          }),
        })

        const contract = getContract({
          address: this.contractAddress,
          abi: FourDomainReaderAbi,
          client: client,
        })

        const result = await contract.read.getDomainByCA([address as Address])

        // 如果找到域名，添加 .four 后缀（如果还没有的话）
        if (result && typeof result === 'string' && result.trim() !== '') {
          const domain = result.trim()
          // 检查是否已经有 .four 后缀
          if (domain.endsWith('.four')) {
            return domain
          } else {
            return `${domain}.four`
          }
        }

        return null
      } catch (error) {
        console.error(`Error reverse resolving address ${address}:`, error)
        return null
      }
    })
  }
}
