import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { createWeb3Name } from '../src'

chai.use(chaiAsPromised)

describe('Batch resolve BnB Addresses To Domains', () => {
  it('it should properly batch resolve address based on bnb', async () => {
    const sid = createWeb3Name()
    const res = await sid.getBatchBnBDomains([
      '0x2886d6792503e04b19640c1f1430d23219af177f',
      '0x2635db6381d4862299e651cc46939588f6db7351',
    ])
    expect(res?.at(0)).to.be.eq('88888888ok.bnb')
    expect(res?.at(1)).to.be.eq('therealzaza.bnb')
  }).timeout(120_000)
  it('it should properly batch resolve a zero address or not Address to empty string', async () => {
    const sid = createWeb3Name()
    const res = await sid.getBatchBnBDomains([
      '0x2886d6792503e04b19640c1f1430d23219af177f',
      '0x0000000000000000000000000000000000000000',
    ])
    expect(res?.at(0)).to.be.eq('88888888ok.bnb')
    expect(res?.at(1)).to.be.eq('')
  }).timeout(120_000)
})
