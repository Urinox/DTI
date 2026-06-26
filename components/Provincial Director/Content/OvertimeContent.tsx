import ContentHeader from "@/components/ContentHeader"
import OvertimeCard from "@/components/Provincial Director/Cards/OvertimeCard"
import { useState } from "react"

export default function OvertimeContent({username, overtimeRequest, id, getOvertimeRequest}:{username: string, overtimeRequest: any[], id: string, getOvertimeRequest: () => void}) {
    const [filter, setFilter] = useState('All')

    return(
        <div className={`flex flex-col w-full bg-gray-200`}>
            <ContentHeader username={username}/>
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <select onChange={(e) => setFilter(e.target.value)} className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'>
                        <option>All</option>
                        <option>Approved</option>
                        <option>Pending</option>
                        <option>Disapproved</option>
                    </select>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {overtimeRequest.map((info) => {
                        return(
                            filter == info.status || filter == 'All' ? <OvertimeCard key={info.id} info={info}/> : ''
                        )
                    })}
                </div>
            </div>
        </div>
    )
}