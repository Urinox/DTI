import Image from "next/image"
import { useState, useEffect } from "react"

interface TravelOrderInfo {
    startDate: string,
    endDate: string,
    expectedOutput: string,
    purpose: string,
    destination: string,
    status: string,
}

export default function TravelOrderCard({info} : {info: TravelOrderInfo}) {
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [endDate, setEndDate] = useState('')
    const [endDay, setEndDay] = useState('')

    function formatStartDate() {
        const date = new Date(info.startDate)
        setStartDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
        setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
    }

    function formatEndDate() {
        const date = new Date(info.endDate)
        setEndDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
        setEndDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
    }

    useEffect(() => {
        formatStartDate()
        formatEndDate()
    }, []);

    return(
        <div className='flex flex-col border-[1] border-gray-500 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1] border-gray-300'>
                <div className='flex flex-col'>
                    <p className='font-bold'>{startDate} ({startDay})</p>
                    <p className='font-bold'>{endDate} ({endDay})</p>
                </div>
                <button className='flex text-white rounded-lg px-5 py-1 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
                    <Image src='/print.svg' width={16} height={16} alt='print'/>
                    <p>Print</p>
                </button>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Expected Output</p>
                <p className='text-gray-600 text-sm'>{info.expectedOutput}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination}</p>
            </div>
            <div className='flex w-full px-5'><p className={`border-2 rounded-lg font-bold px-5 text-sm
            ${info.status == "Approved" ? 'border-green-800 text-green-800 bg-[#EBFFD1]' : (info.status == "Pending" ? 'border-orange-700 text-orange-700 bg-[#FFDECA]' : 'border-[#990202] text-[#990202] bg-[#FFD6D6]')}`}>{info.status}</p></div>
        </div>
    )
}