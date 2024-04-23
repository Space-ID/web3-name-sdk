import logo from './assets/logo.svg'
import { NavLink } from 'react-router-dom'
import { SIDRegisterV3, validateNameV3 } from '@web3-name-sdk/register'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { bscTestnet } from 'viem/chains'

function Home() {
  const handleClick = async () => {
    if (window.ethereum) {
      const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(),
      })
      const walletClient = createWalletClient({
        chain: bscTestnet,
        transport: custom(window.ethereum),
      })
      const address = await walletClient.getAddresses()
      // get address
      const register = new SIDRegisterV3({
        publicClient,
        walletClient,
        identifier: '2636823826277309872098160245320544308382397132302228906642157795810372',
        controllerAddr: '0xc5005a0027ccd013622940202693795973991dd4',
        resolverAddr: '0x87fc5fdE1Db0b8e555aa3e1A7C41C983737DE1B7',
        simulateAccount:address[0],
        simulateValue:'0.1'
      })
      const normalizedLabel = validateNameV3('test124')
      // check if available
      const available = await register.getAvailable(normalizedLabel)
      console.log(available)
      // get price
      const price = await register.getRentPrice(normalizedLabel, 1)
      console.log(price)
      // register for one year
      await register.register('test', address[0], 1, {
        setPrimaryName: false, // 可选参数
      })
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
        <li>
          <NavLink to='/registerv3' className=''>RegisterV3 Example</NavLink>
        </li>
      </ul>
      <button className='btn btn-primary' onClick={handleClick}>Test</button>
    </>
  )
}

export default Home
