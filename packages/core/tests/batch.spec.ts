import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { createWeb3Name } from '../src'

chai.use(chaiAsPromised)
const sid = createWeb3Name()

describe('SID Name resolving', () => {
  it('it should properly batch resolve address based on bnb tld', async () => {
    const res = await sid.batchGetDomainNameByTld({
      addressList: ['0x2886d6792503e04b19640c1f1430d23219af177f', '0xb5932a6b7d50a966aec6c74c97385412fb497540'],
      queryTld: 'bnb',
    })
    expect(res?.at(0)?.domain).to.be.eq('goodh.bnb')
    expect(res?.at(1)?.domain).to.be.eq('spaceid.bnb')
  }).timeout(120_000)
  it('it should properly batch resolve address based on bnb chain ID', async () => {
    const res = await sid.batchGetDomainNameByChainId({
      addressList: ['0x2886d6792503e04b19640c1f1430d23219af177f', '0xb5932a6b7d50a966aec6c74c97385412fb497540'],
      queryChainId: 56,
    })
    expect(res?.at(0)?.domain).to.be.eq('88888888ok.bnb')
    expect(res?.at(1)?.domain).to.be.eq('spaceid.bnb')
  }).timeout(120_000)
  it('it should properly batch resolve address based on arb Tld', async () => {
    const res = await sid.batchGetDomainNameByTld({
      addressList: ['0x77777775b611f0f3d90ccb69ef425a62b35afa7c', '0x3506fbe85e19bf025b228ec58f143ba342c3c608'],
      queryTld: 'arb',
    })
    expect(res?.at(0)?.domain).to.be.eq('megantrhopus.arb')
    expect(res?.at(1)?.domain).to.be.eq('idgue.arb')
  }).timeout(120_000)
  it('it should properly batch resolve address based on arb chain ID', async () => {
    const res = await sid.batchGetDomainNameByChainId({
      addressList: ['0x77777775b611f0f3d90ccb69ef425a62b35afa7c', '0x3506fbe85e19bf025b228ec58f143ba342c3c608'],
      queryChainId: 42_161,
    })
    expect(res?.at(0)?.domain).to.be.eq('megantrhopus.arb')
    expect(res?.at(1)?.domain).to.be.eq('idgue.arb')
  }).timeout(120_000)
  it('it should properly return null to resolve not right address', async () => {
    const res = await sid.batchGetDomainNameByChainId({
      addressList: ['0xf2F1F2dcA525B838CB67BcDf2fAC07357dDB3DbF', '0x3506fbe85e19bf025b228ec58f143ba342c3c608'],
      queryChainId: 42_161,
    })
    expect(res?.at(0)?.domain).to.be.eq(null)
    expect(res?.at(1)?.domain).to.be.eq('idgue.arb')
  }).timeout(120_000)
})
