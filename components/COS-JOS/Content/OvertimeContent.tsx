import ContentHeader from "@/components/ContentHeader"
import OvertimeCard from "@/components/COS-JOS/Cards/OvertimeCard"
import OvertimePopup from "@/components/COS-JOS/Popup/OvertimePopup"
import { useState } from "react"
import Image from "next/image"

export default function OvertimeContent({username, overtimeRequest, id, getOvertimeRequest}:{username: string, overtimeRequest: any[], id: string, getOvertimeRequest: () => void}) {
    const [show, setShow] = useState(false)
    const [filter, setFilter] = useState('All')

    return(
        <div className={`flex flex-col w-full bg-gray-200 ${show ? 'overflow-hidden h-screen' : ''}`}>
            <ContentHeader username={username}/>
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <select onChange={(e) => setFilter(e.target.value)} className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'>
                        <option value='All'>All</option>
                        <option value='Approved'>Approved</option>
                        <option value='Pending'>Pending</option>
                        <option value='Disapproved'>Disapproved</option>
                    </select>
                    <button onClick={() => {setShow(!show)}} className='flex gap-2 border-[1] text-sm items-center border-black cursor-pointer py-1 px-5 rounded-lg font-semibold'>
                        <Image src='/plus.svg' width={16} height={16} alt='add' />
                        <p>New Overtime</p>
                    </button>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {overtimeRequest.map((info) => {
                        return(
                            filter == info.status || filter == 'All' ? <OvertimeCard key={info.id} info={info}/> : ''
                        )
                    })}
                </div>
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${show ? 'flex' : 'hidden'}`}>
                <OvertimePopup showPopup={() => setShow(!show)} id={id} getOvertimeRequest={getOvertimeRequest}/>
            </div>
        </div>
    )
}