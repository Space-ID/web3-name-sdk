# @web3-name-sdk/register

## Installation

---
Install @web3-name-sdk/register, alongside peer dependency [Ethers v5](https://www.npmjs.com/package/ethers/v/5.7.2).

```
npm install @web3-name-sdk/register ethers@5.7.2
```

## Example

Register a .bnb domain

```javascript
async function registerDomain(label: String) {
  // detect provider
  if (window.ethereum) {
    const provider = new providers.Web3Provider(window.ethereum)
    // switch to bsc
    await provider.send('wallet_switchEthereumChain', [{ chainId: '0x38' }])
    // connect wallet
    await provider.send('eth_requestAccounts', [])
    // get signer
    const signer = provider.getSigner()
    // get address
    const address = await signer.getAddress()
    // init SIDRegister
    const register = new SIDRegister({ signer, chainId: 56 })
    // check if available
    const available = await register.getAvailable(label)
    // get price
    const price = await register.getRentPrice(label, 1)
    // register for one year
    await register.register(label, address, 1)
  }
}

```
Register a .arb domain

```javascript
async function registerDomain(label: String) {
  // detect provider
  if (window.ethereum) {
    const provider = new providers.Web3Provider(window.ethereum)
    // switch to arbitrum one
    await provider.send('wallet_switchEthereumChain', [{ chainId: '0xA4B1' }])
    // connect wallet
    await provider.send('eth_requestAccounts', [])
    // get signer
    const signer = provider.getSigner()
    // get address
    const address = await signer.getAddress()
    // init SIDRegister
    const register = new SIDRegister({ signer, chainId: 42161 })
    // check if available
    const available = await register.getAvailable(label)
    // get price
    const price = await register.getRentPrice(label, 1)
    // register for one year
    await register.register(label, address, 1)
  }
}

```

Register a .eth domain

```javascript
async function registerEthDomain(label: String) {
  // detect provider
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
    // init SIDRegister
    const register = new SIDRegister({ signer, chainId: 56 })
    // check if available
    const available = await register.getAvailable(label)
    // get price
    const price = await register.getRentPrice(label, 1)
    // register for one year
    await register.register(label, address, 1, {
      // wait for commit to be valid
      onCommitSuccess:(waitTime) => {
        return new Promise(resolve => {
          setTimeout(resolve, waitTime * 1000)
        })
      }
    })
  }
}
```
