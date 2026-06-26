import ContentHeader from "@/components/ContentHeader"
import PassSlipCard from "@/components/Provincial Director/Cards/PassSlipCard"
import {useEffect, useState} from "react";

export default function PassSlipContent() {
    const [info, setInfo] = useState({})

    useEffect(() => {
        setInfo({
            designation: 'Official',
            date: 'Nov. 11, 2024',
            day: 'Monday',
            startTime: '8:00 AM',
            endTime: '10:00 AM',
            purpose: 'To attend meeting for the organizational activities and finances',
            status: 'Disapproved',
            destination: 'Governor’s Hall, Capitol Compound Bangbangalon, Boac, Marinduque'
        })
    }, [])

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <select className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'>
                        <option>All</option>
                        <option>Approved</option>
                        <option>Pending</option>
                        <option>Disapproved</option>
                    </select>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    <PassSlipCard info={info}/>
                </div>
            </div>
        </div>
    )
}