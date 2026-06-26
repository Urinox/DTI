import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"

export default function CalendarContent() {
    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col bg-white flex-1 m-10 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center font-bold p-5 border-b-[1] border-gray-300'>
                    <p className='text-xl'>Calendar</p>
                    <div className='flex items-center gap-4'>
                        <Image className='cursor-pointer' src='/arrow-left.svg' width={20} height={20} alt='arrow-left'/>
                        <p className='text-xl text-gray-600'>July 2025</p>
                        <Image className='cursor-pointer' src='/arrow-right.svg' width={20} height={20} alt='arrow-right'/>
                    </div>
                    <button className='flex items-center gap-2 bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer'>
                        <Image src='/edit-white.svg' width={20} height={20} alt='edit'/>
                        <p>Edit</p>
                    </button>
                </div>
                <div className='flex flex-col flex-1 rounded-lg border-[1] border-black m-5'>
                    <div className='grid grid-cols-7 justify-items-center text-center font-bold py-2 border-b-[1] border-gray-300'>
                        <p className='w-30'>Monday</p>
                        <p className='w-30'>Tuesday</p>
                        <p className='w-30'>Wednesday</p>
                        <p className='w-30'>Thursday</p>
                        <p className='w-30'>Friday</p>
                        <p className='w-30'>Saturday</p>
                        <p className='w-30'>Sunday</p>
                    </div>
                    <div className='grid flex-1 items-center grid-cols-7 grid-rows-6 justify-items-center'>
                        {[...Array(42)].map((_, i) => {
                            const column = i % 7
                            const row = Math.floor(i / 7)
                            return (
                                <div key={i} className={`w-full h-full font-bold text-sm flex items-center p-5 hover:bg-gray-50 border-gray-300 justify-center relative
                                ${column < 6 ? 'border-r-[1]' : '' }
                                ${row < 6 ? 'border-b-[1]' : ''}`}>
                                    <p className='absolute top-1 left-2'>{i + 1 <= 31 ? i + 1 : ''}</p>
                                    <p className='text-gray-600 text-center'>{i + 1 <= 31 ? 'Holiday' : ''}</p>
                                </div>
                            )})}
                    </div>
                </div>
            </div>
        </div>
    )
}