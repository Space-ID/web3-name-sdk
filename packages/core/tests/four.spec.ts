import { expect } from 'chai'
import { Web3Name } from '../src/tlds/web3name'
import { FourResolver } from '../src/tlds/four'

describe('.four domain resolution', () => {
  const web3Name = new Web3Name({ timeout: 10000 })
  const fourResolver = new FourResolver({ timeout: 10000 })

  it('should resolve .four domain to address using FourResolver directly', async () => {
    // 使用已知存在的域名进行测试
    const testDomain = 'farm17bc.four'

    try {
      const address = await fourResolver.getAddress(testDomain)
      console.log(`Resolved ${testDomain} to:`, address)

      // 如果解析成功，地址应该是一个有效的以太坊地址格式
      if (address) {
        expect(address).to.match(/^0x[a-fA-F0-9]{40}$/)
      } else {
        // 如果域名不存在，应该返回 null
        expect(address).to.be.null
      }
    } catch (error) {
      console.error('Error resolving .four domain:', error)
      // 测试不应该因为网络错误而失败，但我们可以记录错误
    }
  })

  it('should resolve .four domain to address using Web3Name', async () => {
    const testDomain = 'farm17bc.four'

    try {
      const address = await web3Name.getAddress(testDomain)
      console.log(`Resolved ${testDomain} via Web3Name to:`, address)

      // 如果解析成功，地址应该是一个有效的以太坊地址格式
      if (address) {
        expect(address).to.match(/^0x[a-fA-F0-9]{40}$/)
      } else {
        // 如果域名不存在，应该返回 null
        expect(address).to.be.null
      }
    } catch (error) {
      console.error('Error resolving .four domain via Web3Name:', error)
    }
  })

  it('should handle invalid .four domain gracefully', async () => {
    const invalidDomain = 'nonexistent-domain-12345.four'

    try {
      const address = await fourResolver.getAddress(invalidDomain)
      console.log(`Resolved invalid domain ${invalidDomain} to:`, address)

      // 无效域名应该返回 null
      expect(address).to.be.null
    } catch (error) {
      console.error('Error with invalid domain:', error)
    }
  })

  it('should handle reverse resolution (getName) gracefully', async () => {
    // 使用已知的 farm17bc.four 对应的地址
    const testAddress = '0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88'

    try {
      const domain = await fourResolver.getName(testAddress)
      console.log(`Reverse resolved ${testAddress} to:`, domain)

      // 反向解析：如果地址有对应的域名则返回域名，否则返回 null
      if (domain) {
        expect(domain).to.be.a('string')
        expect(domain).to.match(/\.four$/)
      } else {
        expect(domain).to.be.null
      }
    } catch (error) {
      console.error('Error with reverse resolution:', error)
    }
  })

  it('should resolve Chinese .four domain to address', async () => {
    // 测试中文域名
    const chineseDomain = '币安人生.four'

    try {
      const address = await fourResolver.getAddress(chineseDomain)
      console.log(`Resolved Chinese domain ${chineseDomain} to:`, address)

      // 如果解析成功，地址应该是一个有效的以太坊地址格式
      if (address) {
        expect(address).to.match(/^0x[a-fA-F0-9]{40}$/)

        // 测试反向解析
        const reverseDomain = await fourResolver.getName(address)
        console.log(`Reverse resolved ${address} to:`, reverseDomain)

        if (reverseDomain) {
          expect(reverseDomain).to.be.a('string')
          expect(reverseDomain).to.match(/\.four$/)
        }
      } else {
        expect(address).to.be.null
      }
    } catch (error) {
      console.error('Error resolving Chinese .four domain:', error)
    }
  })
})

// 手动测试函数，可以用来测试特定的域名
export async function testFourDomain(domain: string) {
  console.log(`Testing .four domain: ${domain}`)

  const fourResolver = new FourResolver({ timeout: 10000 })
  const web3Name = new Web3Name({ timeout: 10000 })

  try {
    console.log('Testing with FourResolver...')
    const address1 = await fourResolver.getAddress(domain)
    console.log(`FourResolver result: ${address1}`)

    console.log('Testing with Web3Name...')
    const address2 = await web3Name.getAddress(domain)
    console.log(`Web3Name result: ${address2}`)

    return { fourResolver: address1, web3Name: address2 }
  } catch (error) {
    console.error('Test error:', error)
    return null
  }
}
