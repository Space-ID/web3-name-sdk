import { FourResolver, Web3Name } from '@web3-name-sdk/core'
import { useState } from 'react'
import './App.css'

const TIMEOUT_PRESETS = {
  short: 3000,    // 3 seconds
  normal: 10000,  // 10 seconds
  long: 20000,    // 20 seconds
}

type Method = 'getAddress' | 'getName'

type TestCase = {
  title: string
  domainName: string
  address: string
  description: string
}

const TEST_CASES: Record<string, TestCase> = {
  farm17bc: {
    title: 'farm17bc.four',
    domainName: 'farm17bc.four',
    address: '0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88',
    description: '测试英文 .four 域名解析',
  },
  chinese: {
    title: '币安人生.four',
    domainName: '币安人生.four',
    address: '0x924fa68a0FC644485b8df8AbfA0A41C2e7744444',
    description: '测试中文 .four 域名解析',
  },
  custom: {
    title: '自定义域名',
    domainName: '',
    address: '',
    description: '输入自定义的 .four 域名或地址进行测试',
  },
}

function App() {
  const [currentTimeout, setCurrentTimeout] = useState(TIMEOUT_PRESETS.normal)
  const [currentTest, setCurrentTest] = useState<TestCase>(TEST_CASES.farm17bc)
  const [currentMethod, setCurrentMethod] = useState<Method>('getAddress')
  const [customInput, setCustomInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [resolverType, setResolverType] = useState<'FourResolver' | 'Web3Name'>('FourResolver')

  const runTest = async () => {
    setLoading(true)
    setError('')
    setResult('')
    setElapsedTime(0)
    const startTime = Date.now()

    try {
      let resultValue = null
      const input = currentTest.title === '自定义域名' ? customInput : 
                    currentMethod === 'getAddress' ? currentTest.domainName : currentTest.address

      if (!input.trim()) {
        throw new Error('请输入有效的域名或地址')
      }

      if (resolverType === 'FourResolver') {
        const fourResolver = new FourResolver({ timeout: currentTimeout })
        
        switch (currentMethod) {
          case 'getAddress':
            if (!input.endsWith('.four')) {
              throw new Error('域名必须以 .four 结尾')
            }
            resultValue = await fourResolver.getAddress(input)
            break
          case 'getName':
            if (!input.match(/^0x[a-fA-F0-9]{40}$/)) {
              throw new Error('请输入有效的以太坊地址格式')
            }
            resultValue = await fourResolver.getName(input)
            break
        }
      } else {
        const web3Name = new Web3Name({ timeout: currentTimeout })
        
        switch (currentMethod) {
          case 'getAddress':
            if (!input.endsWith('.four')) {
              throw new Error('域名必须以 .four 结尾')
            }
            resultValue = await web3Name.getAddress(input)
            break
          case 'getName':
            if (!input.match(/^0x[a-fA-F0-9]{40}$/)) {
              throw new Error('请输入有效的以太坊地址格式')
            }
            resultValue = await web3Name.getDomainName({ address: input, queryTldList: ['four'], timeout: currentTimeout })
            break
        }
      }

      const endTime = Date.now()
      setElapsedTime(endTime - startTime)
      setResult(resultValue || '未找到结果')
    } catch (err) {
      const endTime = Date.now()
      setElapsedTime(endTime - startTime)
      setError(err instanceof Error ? err.message : '发生未知错误')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentInput = () => {
    if (currentTest.title === '自定义域名') {
      return customInput
    }
    return currentMethod === 'getAddress' ? currentTest.domainName : currentTest.address
  }

  return (
    <div className="dark-theme-container">
      <div className="header">
        <h1>.four 域名解析测试</h1>
        <p>测试 .four 域名的正向和反向解析功能</p>
      </div>

      {/* 解析器选择 */}
      <div className="card">
        <h3>选择解析器</h3>
        <div className="method-select">
          <button
            onClick={() => setResolverType('FourResolver')}
            className={resolverType === 'FourResolver' ? 'active' : ''}
          >
            FourResolver (直接)
          </button>
          <button
            onClick={() => setResolverType('Web3Name')}
            className={resolverType === 'Web3Name' ? 'active' : ''}
          >
            Web3Name (集成)
          </button>
        </div>
      </div>

      {/* 测试用例选择 */}
      <div className="card test-card">
        <h3>选择测试用例</h3>
        <div className="test-select">
          {Object.values(TEST_CASES).map((testCase) => (
            <button
              key={testCase.title}
              onClick={() => setCurrentTest(testCase)}
              className={currentTest.title === testCase.title ? 'active' : ''}
            >
              {testCase.title}
            </button>
          ))}
        </div>
        <div className="test-description">
          <p><strong>当前测试:</strong> {currentTest.title}</p>
          <p>{currentTest.description}</p>
          {currentTest.domainName && (
            <p><strong>域名:</strong> {currentTest.domainName}</p>
          )}
          {currentTest.address && (
            <p><strong>地址:</strong> {currentTest.address}</p>
          )}
        </div>
      </div>

      {/* 自定义输入 */}
      {currentTest.title === '自定义域名' && (
        <div className="card">
          <h3>自定义输入</h3>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={currentMethod === 'getAddress' ? '输入 .four 域名，如: example.four' : '输入以太坊地址，如: 0x...'}
            className="custom-input"
          />
        </div>
      )}

      {/* 方法选择 */}
      <div className="card method-card">
        <h3>选择解析方法</h3>
        <div className="method-select">
          <button
            onClick={() => setCurrentMethod('getAddress')}
            className={currentMethod === 'getAddress' ? 'active' : ''}
          >
            域名 → 地址 (getAddress)
          </button>
          <button
            onClick={() => setCurrentMethod('getName')}
            className={currentMethod === 'getName' ? 'active' : ''}
          >
            地址 → 域名 (getName)
          </button>
        </div>
        <p className="method-description">
          {currentMethod === 'getAddress' 
            ? '将 .four 域名解析为对应的以太坊地址' 
            : '将以太坊地址反向解析为对应的 .four 域名'}
        </p>
      </div>

      {/* 超时设置 */}
      <div className="card timeout-card">
        <h3>超时设置</h3>
        <div className="timeout-select">
          {Object.entries(TIMEOUT_PRESETS).map(([name, value]) => (
            <button
              key={name}
              onClick={() => setCurrentTimeout(value)}
              className={currentTimeout === value ? 'active' : ''}
            >
              {name} ({value}ms)
            </button>
          ))}
        </div>
        <div className="current-input">
          <p><strong>当前输入:</strong> {getCurrentInput() || '请输入内容'}</p>
        </div>
        <div className="actions">
          <button 
            className="primary" 
            onClick={runTest} 
            disabled={loading || !getCurrentInput().trim()}
          >
            {loading ? '解析中...' : `运行 ${currentMethod} (${currentTimeout}ms 超时)`}
          </button>
        </div>
      </div>

      {/* 测试结果 */}
      <div className="card result-card">
        <h3>解析结果</h3>
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>正在解析中...</p>
          </div>
        )}
        {error && (
          <div className="error">
            <h4>❌ 解析失败</h4>
            <p>{error}</p>
            <p>耗时: {elapsedTime}ms</p>
          </div>
        )}
        {!error && result && (
          <div className="success">
            <h4>✅ 解析成功</h4>
            <div className="result-content">
              <div className="result-value">
                <strong>结果:</strong> {result}
              </div>
              <div className="result-meta">
                <p><strong>解析器:</strong> {resolverType}</p>
                <p><strong>方法:</strong> {currentMethod}</p>
                <p><strong>耗时:</strong> {elapsedTime}ms</p>
              </div>
              {result !== '未找到结果' && currentMethod === 'getAddress' && (
                <div className="result-actions">
                  <button 
                    onClick={() => {
                      setCurrentMethod('getName')
                      setCustomInput(result)
                      setCurrentTest(TEST_CASES.custom)
                    }}
                    className="secondary"
                  >
                    用此地址测试反向解析
                  </button>
                </div>
              )}
              {result !== '未找到结果' && currentMethod === 'getName' && (
                <div className="result-actions">
                  <button 
                    onClick={() => {
                      setCurrentMethod('getAddress')
                      setCustomInput(result)
                      setCurrentTest(TEST_CASES.custom)
                    }}
                    className="secondary"
                  >
                    用此域名测试正向解析
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="card info-card">
        <h3>使用说明</h3>
        <div className="info-content">
          <h4>支持的功能:</h4>
          <ul>
            <li><strong>正向解析:</strong> 将 .four 域名解析为以太坊地址</li>
            <li><strong>反向解析:</strong> 将以太坊地址解析为 .four 域名</li>
            <li><strong>中文域名:</strong> 完全支持中文字符的域名</li>
            <li><strong>双解析器:</strong> 支持 FourResolver 和 Web3Name 两种解析方式</li>
          </ul>
          
          <h4>测试用例:</h4>
          <ul>
            <li><strong>farm17bc.four:</strong> 英文域名测试</li>
            <li><strong>币安人生.four:</strong> 中文域名测试</li>
            <li><strong>自定义域名:</strong> 输入任意 .four 域名或地址</li>
          </ul>

          <h4>技术信息:</h4>
          <ul>
            <li><strong>网络:</strong> BSC (Binance Smart Chain)</li>
            <li><strong>合约地址:</strong> 0xd2865AFd9684c4b04c25B2205710484b2879d8Ad</li>
            <li><strong>支持方法:</strong> getDomainInfo, getDomainByCA</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App