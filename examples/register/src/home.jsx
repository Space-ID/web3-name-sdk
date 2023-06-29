import logo from './assets/logo.svg'
import {NavLink} from "react-router-dom";

function Home() {
    return (
        <>
            <a href="https://www.space.id" target='_blank' rel="noreferrer">
                <img src={logo} width={500} className='mt-10'/>
            </a>
            <p className='text-xl font-bold mt-5'>One-stop Web3 Domain & Identity Platform</p>
            <ul className='mt-5 list-disc text-left'>
                <li>
                    <NavLink to='/resolve' className=''>Resolve Domain Example</NavLink>
                </li>
                <li>
                    <NavLink to='/register' className=''>Register Example</NavLink>
                </li>
            </ul>
        </>
    )
}

export default Home
