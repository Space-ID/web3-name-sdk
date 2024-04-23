import { SIDRegisterV3, validateNameV3 } from '@web3-name-sdk/register'
import { utils } from 'ethers'
import './App.css'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { useAccount, useNetwork } from 'wagmi'
import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { bscTestnet } from 'viem/chains'

function RegisterV3() {
  const [inputName, setInputName] = useState('')
  const [availableName, setAvailableName] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [year, setYear] = useState(1)
  const [checked, setChecked] = useState(false)
  const [referrer, setReferrer] = useState('')
  const [price, setPrice] = useState('')
  const deferredInputName = useDeferredValue(inputName)
  const [show, setShow] = useState(false)
  const { address } = useAccount()
  const sidRegistrarRef = useRef<SIDRegisterV3>null
  const { chain } = useNetwork()
  useEffect(() => {
    if (address) {
      sidRegistrarRef.current = new SIDRegisterV3({
        publicClient: createPublicClient({
          chain: [bscTestnet],
          transport: http(),
        }),
        walletClient: createWalletClient({
          chain: [bscTestnet],
          transport: custom(window.ethereum),
        }),
        identifier: '2636823826277309872098160245320544308382397132302228906642157795810372',
        controllerAddr: '0xc5005a0027ccd013622940202693795973991dd4',
        resolverAddr: '0x87fc5fdE1Db0b8e555aa3e1A7C41C983737DE1B7',
        simulateAccount: address[0],
      })
    } else {
      sidRegistrarRef.current = null
    }
  }, [address])

  useEffect(() => {
    setInvalid(false)
    setAvailableName('')
    if (deferredInputName && sidRegistrarRef.current) {
      try {
        const normalizedName = validateNameV3(deferredInputName)
        sidRegistrarRef.current.getAvailable(normalizedName).then(res => {
          if (res) {
            setAvailableName(normalizedName)
          }
        })
      } catch (e) {
        console.error(e)
        setInvalid(true)
      }
    }
  }, [deferredInputName])

  const getPrice = async () => {
    if (sidRegistrarRef.current) {
      const res = await sidRegistrarRef.current.getRentPrice(availableName, year)
      setPrice(utils.formatEther(res))
    }
  }
  const register = async () => {
    if (sidRegistrarRef.current) {
      await sidRegistrarRef.current.register(availableName, address, year, {
        setPrimaryName: checked, referrer: referrer,
      })
      setShow(true)
    }
  }
  return (<>
    <div class=''>
      <p className='text-black text-2xl font-bold'>tld config</p>
      <div class='flex'>
      </div>
    </div>
    <div className='mt-10 flex flex-col gap-4 w-[320px]'>
      <p className='text-black text-2xl font-bold'>Register a domain</p>
      <div className='form-control w-full'>
        <label className='label'>
          <span className='label-text text-black'>Search For A Name</span>
        </label>
        <div className='flex gap-1 items-center'>
          <input value={inputName} onChange={event => setInputName(event.target.value.trim())} type='text'
                 placeholder='Enter a name'
                 className='input input-primary input-bordered w-full max-w-xs' />
          <p></p>
        </div>
      </div>
      <div className='flex gap-1 font-bold items-center'>
        {invalid ? <span className='text-error'>Invalid name</span> : <>
          <span className='font-bold'>Available Domain:</span>
          {availableName ? <span className='text-primary'>{availableName}</span> :
            <span className='text-error'>None</span>}
        </>}
      </div>
      <div className='form-control w-full'>
        <label className='label'>
          <span className='label-text text-black'>Registration Year</span>
        </label>
        <input value={year}
               min={1}
               onChange={event => setYear(Number(event.target.value))}
               type='number'
               className='input input-primary input-bordered w-full max-w-xs' />
        {year < 1 && <label className='label'>
          <span className='label-text text-error'>minimum registration for one year</span>
        </label>}

      </div>
      <div className='flex flex-col gap-1'>
        <button onClick={getPrice} disabled={!availableName || year < 1} className='btn btn-primary'>
          Get Price
        </button>

        <p className='text-left'>
          {price ? `${price}` : '--'}
        </p>
      </div>
      <div className='form-control w-full'>
        <label className='label'>
          <span className='label-text text-black'>Set As Primary Name</span>
        </label>
        <input type='checkbox' className='toggle toggle-primary'
               onChange={(e) => setChecked(e.target.checked)}
               checked={checked} />
      </div>
      <div className='form-control w-full'>
        <label className='label'>
          <span className='label-text text-black'>Referral Domain</span>
        </label>
        <input value={referrer} onChange={event => setReferrer(event.target.value.trim())} type='text'
               className='input input-primary input-bordered w-full max-w-xs' />
      </div>
      <button disabled={!availableName || year < 1} onClick={register} className='btn btn-primary'>Register
      </button>
    </div>
    {show && <>
      <input defaultChecked={true} type='checkbox' id='register-success-modal' className='modal-toggle' />
      <label htmlFor='register-success-modal' className='modal cursor-pointer'>
        <label className='modal-box relative' htmlFor=''>
          <h3 className='text-lg font-bold mb-5'>Register Success!</h3>
          <a href='https://space.id/profile/domains'
             target='_blank' className='link link-primary' rel='noreferrer'>Manage Domain In Space ID</a>
        </label>
      </label>
    </>}
  </>)
}

export default RegisterV3