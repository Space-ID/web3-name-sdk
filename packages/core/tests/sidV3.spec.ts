import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { createInjName } from '../src/injName'
import { createSeiName } from '../src/seiName'
import { createSolName } from '../src/solName'

chai.use(chaiAsPromised)

describe('SID V3 Name resolving', () => {
  it('it should properly resolve address using SNS', async () => {
    const web3Name = createSolName()
    const domain = await web3Name.getDomainName({
      address: 'HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA',
    })
    expect(domain).to.be.eq('bonfida.sol')
  }).timeout(10000)

  it('it should properly resolve domain using SNS', async () => {
    const web3Name = createSolName()
    const address = await web3Name.getAddress({
      name: 'bonfida.sol',
    })
    expect(address).to.be.eq('HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA')
  }).timeout(10000)

  it('it should properly resolve address using Sei Name', async () => {
    const web3Name = createSeiName()
    const domain = await web3Name.getDomainName({
      address: 'sei1tmew60aj394kdfff0t54lfaelu3p8j8lz93pmf',
    })
    expect(domain).to.be.eq('allen.sei')
  }).timeout(10000)

  it('it should properly resolve domain using Sei Name', async () => {
    const web3Name = createSeiName()
    const address = await web3Name.getAddress({
      name: 'french.sei',
    })
    expect(address).to.be.eq('sei1qu9zn44wzvmjtpg3km8dk2ej50de4dm4hemnqp')
  }).timeout(10000)

  it('it should properly resolve address using Inj Name', async () => {
    const web3Name = createInjName()
    const domain = await web3Name.getDomainName({
      address: 'inj10zvhv2a2mam8w7lhy96zgg2v8d800xcs7hf2tf',
    })
    expect(domain).to.be.eq('testtest.inj')
  }).timeout(10000)

  it('it should properly resolve domain using Inj Name', async () => {
    const web3Name = createInjName()
    const address = await web3Name.getAddress({
      name: 'testtest.inj',
    })
    expect(address).to.be.eq('inj10zvhv2a2mam8w7lhy96zgg2v8d800xcs7hf2tf')
  }).timeout(10000)
})
