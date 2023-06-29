import { utils, BigNumber } from 'ethers'

export const yearInSeconds = 31556952

export function calculateDuration(years) {
  return BigNumber.from(parseInt((years * yearInSeconds).toFixed()))
}

export function genCommitSecret() {
  return utils.hexlify(utils.randomBytes(32))
}

export function getBufferedPrice(price) {
  return price.mul(110).div(100)
}
