import Image from "next/image";

export default function TravelOrderCard({info}) {
    return(
        <div className='flex flex-col border-[1] border-gray-500 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1] border-gray-300'>
                <div className='flex flex-col'>
                    <p className='font-bold'>{info.date} ({info.day})</p>
                </div>
                <div className='flex gap-2 text-sm font-bold'>
                    <button className='flex items-center text-white rounded-lg px-5 py-1 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p>Print</p>
                    </button>
                    <input className='border-[1] rounded-lg px-3 py-1 cursor-pointer border-green-800 text-green-800 bg-[#EBFFD1]' type='button' value='Approve'/>
                    <input className='border-[1] rounded-lg px-3 py-1 cursor-pointer border-[#990202] text-[#990202] bg-[#FFD6D6]' type='button' value='Disapprove'/>
                </div>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Expected Output</p>
                <p className='text-gray-600 text-sm'>{info.output}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination}</p>
            </div>
        </div>
    )
}