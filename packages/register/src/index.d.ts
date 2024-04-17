import { PublicClient, WalletClient, Chain, Hex, Address } from 'viem'

type SupportedChainId = 1 | 56 | 42161 | 97 | 421613
type ReferralSupportedChainId = 56 | 42161 | 97 | 421613
type SIDRegisterOptions = {
  signer: Signer
  sidAddress?: string
  chainId: SupportedChainId
}
type SIDRegisterOptionsV2 = {
  publicClient: PublicClient
  walletClient: WalletClient
  chainId: number,
  tldId: number,
  identifier: Hex,
  controllerAddr: Address,
}

type RegisterOptions = {
  referrer?: string
  setPrimaryName?: boolean
  onCommitSuccess?: (waitTime: number) => Promise<void>
}

export { SIDRegisterOptions, RegisterOptions, SupportedChainId, ReferralSupportedChainId, SIDRegisterOptionsV2 }
