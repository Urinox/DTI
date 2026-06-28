// components/COS-JOS/Content/PassSlipContent.tsx
import ContentHeader from "@/components/ContentHeader"
import PassSlipCard from "@/components/COS-JOS/Cards/PassSlipCard"
import PassSlipPopup from "@/components/COS-JOS/Popup/PassSlipPopup"
import { useState } from "react"
import Image from "next/image"

export default function PassSlipContent({
    username,
    passSlip,
    id,
    getPassSlip
}: {
    username: string;
    passSlip: any[];
    id: string;
    getPassSlip: () => void;
}) {
    const [show, setShow] = useState(false)
    const [filter, setFilter] = useState('All')

    const filteredPassSlips = filter === 'All'
        ? passSlip
        : passSlip.filter(info => info.status === filter)

    return (
        <div className={`flex flex-col w-full ${show ? 'overflow-hidden h-screen' : ''}`}>
            {/* ✅ Remove username and userId props */}
            <ContentHeader />
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black shadow-xl shadow-gray-500/30'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <select
                        onChange={(e) => setFilter(e.target.value)}
                        className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'
                        value={filter}
                    >
                        <option value='All'>All</option>
                        <option value='Approved'>Approved</option>
                        <option value='Pending'>Pending</option>
                        <option value='Disapproved'>Disapproved</option>
                    </select>
                    <button
                        onClick={() => { setShow(!show) }}
                        className='flex gap-2 border-[1] text-sm items-center border-black cursor-pointer py-1 px-5 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
                    >
                        <Image src='/plus.svg' width={16} height={16} alt='add' />
                        <p>New Pass Slip</p>
                    </button>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {filteredPassSlips.length === 0 ? (
                        <div className='text-center text-gray-500 py-10'>
                            No pass slips found
                        </div>
                    ) : (
                        filteredPassSlips.map((info) => (
                            <PassSlipCard key={info.id} info={info} />
                        ))
                    )}
                </div>
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${show ? 'flex' : 'hidden'}`}>
                <PassSlipPopup
                    showPopup={() => setShow(!show)}
                    id={id}
                    getPassSlip={getPassSlip}
                />
            </div>
        </div>
    )
}