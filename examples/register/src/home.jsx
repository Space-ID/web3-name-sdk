import logo from './assets/logo.svg'
import { NavLink } from 'react-router-dom'
import { providers } from 'ethers'
import SIDRegister from '@web3-name-sdk/register'

function Home() {
  const handleClick = async () => {
    if (window.ethereum) {
      const provider = new providers.Web3Provider(window.ethereum)
      // switch to bsc
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0x1' }])
      // connect wallet
      await provider.send('eth_requestAccounts', [])
      // get signer
      const signer = provider.getSigner()
      // get address
      const address = await signer.getAddress()

      const register = new SIDRegister({ signer, chainId: 1 })
      // check if available
      const available = await register.getAvailable('test')
      // get price
      const price = await register.getRentPrice('test', 1)
      // register for one year
      await register.register('test', address, 1,{onCommitSuccess})
    }
  }
  return (
    <>
      <a href='https://www.space.id' target='_blank' rel='noreferrer'>
        <img src={logo} width={500} className='mt-10' />
      </a>
      <p className='text-xl font-bold mt-5'>One-stop Web3 Domain & Identity Platform</p>
      <ul className='mt-5 list-disc text-left'>
        <li>
          <NavLink to='/register' className=''>Register Example</NavLink>
        </li>
      </ul>
      <button className='btn btn-primary' onClick={handleClick}>Test</button>
    </>
  )
}

export default Home
