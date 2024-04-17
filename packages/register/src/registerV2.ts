import { Address, Hex, PublicClient, WalletClient } from 'viem'
import { validateName, countCharacters } from '@web3-name-sdk/core/dist/utils'

import { RegisterOptions, SIDRegisterOptionsV2, SupportedChainId } from './index.d'
import { calculateDuration, getBufferedPrice, genCommitSecret } from './utils/register'
import { getReferralSignature } from './utils/referral'
import { ENS_COMMIT_WAIT_TIEM } from './constants'
import ensRegisterAbi from './abi/ens'
import { wait } from './utils'
import { Signer } from 'ethers'

export default class SIDRegisterV2 {
  private readonly publicClient: PublicClient
  private readonly walletClient: WalletClient
  private readonly tldId: number
  private readonly chainId: number
  private readonly identifier: Hex
  private readonly controllerAddr: Address

  constructor(options: SIDRegisterOptionsV2) {
    const { publicClient, walletClient, chainId, tldId, identifier, controllerAddr } = options
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.tldId = tldId
    this.identifier = identifier
    this.controllerAddr = controllerAddr
    this.chainId = chainId
  }

  private async getPublicResolver() {
    const sid = new SID({ provider: this.signer.provider, sidAddress: this.sidAddress })
    if (this.chainId === 1) {
      return sid.name('resolver.eth').getAddress()
    }
    return sid.name(`sid-resolver.${getTldByChainId(this.chainId)}`).getAddress()
  }

  /**
   * Get the rent price for a name.
   * @param label
   * @param year number of registration years
   */
  async getRentPrice(label: string, year: number): Promise<BigNumber> {
    const normalizedName = validateName(label)
    if (normalizedName !== label) throw new Error('unnormailzed name')
    const registrarController = await this.getRegistrarController()
    const res = await registrarController.rentPrice(normalizedName, calculateDuration(year))
    if (this.chainId === 1) {
      return res
    }
    return res[0].add(res[1])
  }

  /**
   * check if the domain is available for registration
   * @param label
   */
  async getAvailable(label: string): Promise<boolean> {
    const normalizedName = validateName(label)
    if (normalizedName !== label) throw new Error('unnormailzed name')
    const registrarController = await this.getRegistrarController()
    return registrarController.available(normalizedName)
  }

  /**
   * register a domain
   * @param label
   * @param address the address to register
   * @param year
   * @param options.referrer optional parameter. the referrer domain. only work for .bnb and .arb domain
   * @param options.setPrimaryName optional parameter. register and set the domain as primary name. only work for .bnb and .arb domain
   * @param options.onCommitSuccess optional parameter. callback function when the commitment is successful. only required for .eth domain
   */
  async register(
    label: string,
    address: string,
    year: number,
    options?: RegisterOptions,
  ): Promise<string> {
    const referrer = options?.referrer
    const setPrimaryName = options?.setPrimaryName

    const normalizedName = validateName(label)
    if (normalizedName !== label) throw new Error('unnormailzed name')
    if (year < 1) throw new Error('minimum registration for one year')

    const duration = calculateDuration(year)

    const publicResolver = await this.getPublicResolver()
    const registrarController = await this.getRegistrarController()

    const secret = genCommitSecret()
    if (this.chainId === 1) {
      const commitment = await registrarController.makeCommitmentWithConfig(
        normalizedName,
        address,
        secret,
        publicResolver,
        address,
      )
      const tx = await registrarController?.commit(commitment)
      await tx?.wait()
      const checkRes = await registrarController?.commitments(commitment)
      const createTime = checkRes?.toNumber() ?? 0
      if (createTime > 0) {
        if (options?.onCommitSuccess) {
          await options.onCommitSuccess(ENS_COMMIT_WAIT_TIEM)
        } else {
          await wait(ENS_COMMIT_WAIT_TIEM * 1000)
        }
      } else {
        throw new Error('commitment error')
      }
    }

    const priceRes = await this.getRentPrice(normalizedName, year)
    const bufferedPrice = getBufferedPrice(priceRes)

    let tx: ContractTransaction
    if (this.chainId === 1) {
      const gas = await registrarController.estimateGas?.registerWithConfig(
        normalizedName,
        address,
        duration,
        secret,
        publicResolver,
        address,
        {
          value: bufferedPrice,
        },
      )
      const gasLimit = (gas ?? BigNumber.from(0)).add(21000)
      tx = await registrarController?.registerWithConfig(
        normalizedName,
        address,
        duration,
        secret,
        publicResolver,
        address,
        {
          value: bufferedPrice,
          gasLimit: gasLimit ? BigNumber.from(gasLimit) : undefined,
        },
      )
    } else {
      const referralSign = await getReferralSignature(referrer ?? '', this.chainId)
      const gas = await registrarController.estimateGas?.registerWithConfigAndPoint(
        normalizedName,
        address,
        duration,
        publicResolver,
        false,
        setPrimaryName,
        referralSign,
        {
          value: bufferedPrice,
        },
      )
      const gasLimit = (gas ?? BigNumber.from(0)).add(21000)
      tx = await registrarController.registerWithConfigAndPoint(
        normalizedName,
        address,
        duration,
        publicResolver,
        false,
        setPrimaryName,
        referralSign,
        {
          value: bufferedPrice,
          gasLimit,
        },
      )
    }
    await tx.wait()
    return normalizedName
  }
}
