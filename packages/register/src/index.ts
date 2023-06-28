import {BigNumber, Signer, Contract} from "ethers";
import SID, {namehash, validateName} from "@siddomains/sidjs";
import {interfaces} from "@siddomains/sidjs/dist/constants/interfaces";
import {getRegistrarControllerContract, getResolverContract, getSIDContract} from '@siddomains/sidjs/dist/utils/contract'

import {RegisterOptions} from './index.d'
import {calculateDuration, getBufferedPrice} from "../utils/register";
import {getReferralSignature} from "../utils/referral";
const getTldByChainId = (chainId) => {
  const id = parseInt(chainId)
  switch (id) {
    case 1:
      return 'eth';
    case 97:
    case 56:
      return 'bnb';
    case 42161:
    case 421613:
      return 'arb';
    default:
      return 'bnb'
  }
}

const supportedChainIds = [1,56, 97, 42161, 421613]

class SIDRegistrar {
  private sidAddress: any
  private signer: Signer
  private registrarController?: Contract
  constructor(options) {
    const {signer, sidAddress} = options;
    if (!Signer.isSigner(signer)) throw new Error('signer is required')
    if (!sidAddress) throw new Error('sidAddress is required')
    this.sidAddress = sidAddress
    this.signer = signer
    this.registrarController = null
  }

  async getRegistrarController() {
    if (!this.registrarController) {
      const sidContract = getSIDContract({address: this.sidAddress, provider: this.signer.provider})
      const chainId = await this.signer.getChainId()
      if (!supportedChainIds.includes(chainId)) {
        throw new Error('unsupported network')
      }
      const hash = namehash(getTldByChainId(chainId))
      const resolverAddr = await sidContract.resolver(hash)
      const resolverContract = getResolverContract({address: resolverAddr, provider: this.signer.provider});
      const registrarControllerAddr = await resolverContract.interfaceImplementer(hash, interfaces.permanentRegistrar)
      this.registrarController = getRegistrarControllerContract({
        address: registrarControllerAddr,
        signer: this.signer
      })
      return this.registrarController
    }
    return this.registrarController
  }

  async getPublicResolver(chainId) {
    const sid = new SID({provider: this.signer.provider, sidAddress: this.sidAddress});
    return sid.name(`sid-resolver.${getTldByChainId(chainId)}`).getAddress()
  }

  async getRentPrice(label, year) {
    const normalizedName = validateName(label)
    if (normalizedName !== label) throw new Error('unnormailzed name')
    const registrarController = await this.getRegistrarController()
    return registrarController.rentPrice(normalizedName, calculateDuration(year))
  }

  async getAvailable(label) {
    const normalizedName = validateName(label)
    if (normalizedName !== label) throw new Error('unnormailzed name')
    const registrarController = await this.getRegistrarController()
    return registrarController.available(normalizedName)
  }

  async register(label, address, year, options?:RegisterOptions) {

    const referrer = options?.referrer
    const setPrimaryName = options?.setPrimaryName

    const normalizedName = validateName(label)
    if (normalizedName !== label) throw new Error('unnormailzed name')
    if (year < 1) throw new Error('minimum registration for one year')
    const duration = calculateDuration(year)
    const priceRes = await this.getRentPrice(normalizedName, year)

    const bufferedPrice = getBufferedPrice(priceRes[0].add(priceRes[1]))

    const chainId = await this.signer.getChainId()

    const publicResolver = await this.getPublicResolver(chainId)
    const referralSign = await getReferralSignature(referrer, chainId)
    const registrarController = await this.getRegistrarController()
    const gas = await registrarController.estimateGas?.registerWithConfigAndPoint(normalizedName, address, duration, publicResolver, false, setPrimaryName, referralSign, {
      value: bufferedPrice
    })
    const gasLimit = (gas ?? BigNumber.from(0)).add(21000)

    const tx = await registrarController.registerWithConfigAndPoint(normalizedName, address, duration, publicResolver, false, setPrimaryName, referralSign, {
      value: bufferedPrice,
      gasLimit
    })
    await tx.wait()
    return normalizedName
  }
}

export default SIDRegistrar
