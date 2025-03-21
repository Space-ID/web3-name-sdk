import { createWeb3Name, createPaymentIdName, } from '../../../packages/core/src'
import { createSeiName } from '../../../packages/core/src/seiName'
import { useEffect, useState } from 'react'
import './App.css'

const TIMEOUT_PRESETS = {
  veryShort: 100, // Intentionally short to test timeout
  normal: 5000, // Normal timeout (5s)
  long: 15000, // Long timeout (15s)
  invalid: -1, // Invalid timeout value
}

type Protocol = 'EVM' | 'Solana' | 'Sei' | 'Injective'
type Method = 'getAddress' | 'getDomainName' | 'getMetadata' | 'getContentHash'

type TestCase = {
  title: string
  domainName: string
  address: string
  protocol: Protocol
  description: string
  rpcUrl?: string
}

const TEST_CASES: Record<string, TestCase> = {
  evm: {
    title: 'EVM Test',
    domainName: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    protocol: 'EVM',
    description: 'Testing EVM name resolution with timeout parameter',
  },
  evmSlow: {
    title: 'EVM Slow RPC Test',
    domainName: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    protocol: 'EVM',
    description: 'Testing EVM with a slow RPC to verify timeout',
    rpcUrl: 'https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7',
  },
  evmFake: {
    title: 'EVM Fake RPC Test',
    domainName: 'vitalik.eth',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    protocol: 'EVM',
    description: 'Testing EVM with a non-existent RPC to test timeout',
    rpcUrl: 'https://fake-rpc-endpoint.example.com',
  },
  solana: {
    title: 'Solana Test',
    domainName: 'bonfida.sol',
    address: '9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL',
    protocol: 'Solana',
    description: 'Testing Solana name resolution with timeout parameter',
  },
  sei: {
    title: 'Sei Test',
    domainName: 'allen.sei',
    address: 'sei1g9gf07p3v33j4dn988d99nwnf3pxpxj8xvvq6d',
    protocol: 'Sei',
    description: 'Testing Sei name resolution with timeout parameter',
  },
  injective: {
    title: 'Injective Test',
    domainName: 'allen.inj',
    address: 'inj1g9gf07p3v33j4dn988d99nwnf3pxpxj8n4c5v2',
    protocol: 'Injective',
    description: 'Testing Injective name resolution with timeout parameter',
  },
}

function App() {
  const [domain, setDomain] = useState('') // 用户输入的域名
  const [chainId, setChainId] = useState('') // 用户输入的 chainId
  const [address, setAddress] = useState('') // 查询结果
  const [loading, setLoading] = useState(false) // 加载状态

  useEffect(() => {
    const handleLookup = async () => {
      if (!domain) {
        setAddress('')
        return
      }

      setLoading(true)
      try {
        const web3Name = createWeb3Name()
        const payMentIdName = createSeiName()

        const parsedChainId = chainId ? parseInt(chainId, 10) : 1 // 默认使用 1
        const res = domain.includes('@')
          ? await payMentIdName.getAddress({ name: domain })
          : await web3Name.getAddress(domain)

        setAddress(res ?? 'Notfound')
      } catch (error) {
        setAddress('Failed')
        console.error(error)
      }
      setLoading(false)
    }

    // 防抖（用户停止输入 500ms 后再查询）
    const timeout = setTimeout(() => {
      handleLookup()
    }, 500)

    return () => clearTimeout(timeout)
  }, [domain, chainId]) // 监听 chainId 变化，实时更新查询

  return (
    <div className="dark-theme-container">
      <div className="header">
        <h1>Web3Name SDK Timeout Testing</h1>
        <p className="description">
          Testing timeout functionality for EVM, Solana, Sei, and Injective protocols. Each protocol supports timeout
          both during initialization and method calls.
        </p>
      </div>
      <h1>Vite + React</h1>

      <div className="card">
        <input
          type="text"
          placeholder="search"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '250px', marginBottom: '10px' }}
        />
      </div>

      <div className="card">
        <input
          type="number"
          placeholder=" Chain ID（default 1）"
          value={chainId}
          onChange={(e) => setChainId(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '250px', marginBottom: '10px' }}
        />
      </div>

      <div style={{ fontSize: '18px' }}>
        {loading ? 'search...' : domain ? `[${domain}] (Chain ID: ${chainId || 1}) address: ${address}` : 'search'}
      </div>

      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </div>
  )
}

export default App