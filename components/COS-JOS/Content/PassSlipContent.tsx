import ContentHeader from "@/components/ContentHeader"
import PassSlipCard from "@/components/COS-JOS/Cards/PassSlipCard"
import PassSlipPopup from "@/components/COS-JOS/Popup/PassSlipPopup"
import Image from "next/image"
import {useState} from "react";

export default function PassSlipContent({username, passSlip, id, getPassSlip}:{username: string, passSlip: any[], id: string, getPassSlip: () => void}) {
    const [show, setShow] = useState(false)
    const [filter, setFilter] = useState('All')

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader username={username}/>
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <select className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'>
                        <option>All</option>
                        <option>Approved</option>
                        <option>Pending</option>
                        <option>Disapproved</option>
                    </select>
                    <button onClick={() => setShow(!show)} className='flex gap-2 border-[1] text-sm items-center border-black cursor-pointer py-1 px-5 rounded-lg font-semibold'>
                        <Image src='/plus.svg' width={16} height={16} alt='add' />
                        <p>New Pass Slip</p>
                    </button>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {passSlip.map((info) => {
                        return(
                            <PassSlipCard key={info.id} info={info}/>
                        )
                    })}
                </div>
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${show ? 'flex' : 'hidden'}`}>
                <PassSlipPopup showPopup={() => setShow(!show)}/>
            </div>
        </div>
    )
}