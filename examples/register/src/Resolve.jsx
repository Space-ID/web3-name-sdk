import {useState} from "react";
import SID, {getSidAddress} from "@siddomains/sidjs";
import {useProvider} from "wagmi";

function Resolve() {
    const [inputDomain, setInputDomain] = useState('')
    const [address, setAddress] = useState('')
    const [inputAddress, setInputAddress] = useState('')
    const [domain, setDomain] = useState('')
    const provider = useProvider({chainId: 56})
    const handleResolve = async () => {
        const sid = new SID({provider, sidAddress: getSidAddress(56)})
        try {
            const res = await sid.name(inputDomain).getAddress()
            setAddress(res)
        } catch (e) {
            console.error(e)
        }
    }
    const handleReverseResolve = async () => {
        const sid = new SID({provider, sidAddress: getSidAddress(56)})
        try {
            const res = await sid.getName(inputAddress)
            setDomain(res.name)
        } catch (e) {
            console.error(e)
        }
    }
    return (
        <div className='mt-10 flex flex-col gap-4 w-[600px]'>
            <p className='text-black text-2xl font-bold'>Resolve .bnb domain</p>
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text text-black">Resolve domain</span>
                </label>
                <div className='grid grid-cols-[1fr_120px] gap-2 items-center'>
                    <input value={inputDomain} onChange={event => setInputDomain(event.target.value.trim())} type="text"
                           placeholder="Enter a domain.eg:test.bnb"
                           className="input input-primary input-bordered w-full"/>
                    <button onClick={handleResolve} className='btn btn-primary normal-case'>Get Address</button>
                </div>
                <label className="label select-auto font-bold">
                    <span className="label-text text-black">{address}</span>
                </label>
            </div>
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text text-black">Reverse Resolve</span>
                </label>
                <div className='grid grid-cols-[1fr_120px] gap-2 items-center'>
                    <input value={inputAddress} onChange={event => setInputAddress(event.target.value.trim())}
                           type="text"
                           placeholder="Enter a address"
                           className="input input-primary input-bordered w-full"/>
                    <button onClick={handleReverseResolve} className='btn btn-primary normal-case'>Get Name</button>
                </div>
                <label className="label select-auto font-bold">
                    <span className="label-text text-black">{domain}</span>
                </label>
            </div>
        </div>
    )
}

export default Resolve
