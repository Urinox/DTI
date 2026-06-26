import Image from "next/image"
import ContentHeader from "@/components/ContentHeader"

export default function DTRContent({username}:{username: string}) {
    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader username={username}/>
            <div className='flex'>
                <div className='flex flex-col bg-white items-center justify-center my-5 mx-10 px-10 py-5 gap-2 border-[1] border-black rounded-xl'>
                    <Image src='/face.png' width={80} height={80} alt='face'/>
                    <p className='font-bold text-2xl'>07:47:15 AM</p>
                    <input className=' mt-2 font-semibold text-white bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] px-5 py-1 rounded-lg cursor-pointer' type='button' value='Time In'/>
                </div>
                <div className='flex bg-white items-center justify-evenly my-5 mr-10 flex-1 rounded-xl border-[1] border-black'>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Tardiness</p>
                            <p className='text-3xl'>0 - 00:00:00</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Undertime</p>
                            <p className='text-3xl'>0 - 00:00:00</p>
                        </div>
                    </div>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Personal Calamity</p>
                            <p className='text-3xl'>0 - 00:00:00</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Overtime</p>
                            <p className='text-3xl'>5 - 05:00:00</p>
                        </div>
                    </div>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Sick Leave</p>
                            <p className='text-3xl'>0 - 00:00:00</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Vacation Leave</p>
                            <p className='text-3xl'>0 - 00:00:00</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-col bg-white mx-10 rounded-xl border-[1] border-black gap-4'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-black'>
                    <p className='font-bold text-xl'>Attendance Logs</p>
                    <button className='flex gap-2 items-center bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] py-1 px-5 rounded-lg text-white cursor-pointer'>
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p className='font-semibold'>Print</p>
                    </button>
                </div>
                <div>
                    <input onChange={() => {}} className='border-[1] outline-0 border-black px-5 py-1 mx-10 rounded-lg' type='month' value='2025-07'/>
                </div>
                <div className='flex flex-col border-2 border-gray-400 mx-5 mb-5 rounded-lg'>
                    <table className='text-gray-700'>
                        <thead className='bg-gray-200 border-b-2 border-gray-400'>
                            <tr>
                                <th className='border-r-[1] border-gray-400' rowSpan={2}>Day</th>
                                <th className='border-r-[1] border-b-[1] py-1 border-gray-400' colSpan={2}>Morning</th>
                                <th className='border-r-[1] border-b-[1] border-gray-400' colSpan={2}>Afternoon</th>
                                <th className='border-r-[1] border-b-[1] border-gray-400' colSpan={2}>Overtime</th>
                                <th className='border-r-[1] border-b-[1] border-gray-400' rowSpan={2}>Total Hours</th>
                                <th rowSpan={2}>Remarks</th>
                            </tr>
                            <tr>
                                <th className='border-r-[1] py-1 border-gray-400'>In</th>
                                <th className='border-r-[1] border-gray-400'>Out</th>
                                <th className='border-r-[1] border-gray-400'>In</th>
                                <th className='border-r-[1] border-gray-400'>Out</th>
                                <th className='border-r-[1] border-gray-400'>In</th>
                                <th className='border-r-[1] border-gray-400'>Out</th>
                            </tr>
                        </thead>
                        <tbody className='text-center bg-white'>
                        <tr className='border-t-[1] border-gray-400 hover:bg-gray-50'>
                            <td className='border-r-[1] border-gray-400 py-1'>1</td>
                            <td className='border-r-[1] border-gray-400'>7:30</td>
                            <td className='border-r-[1] border-gray-400'>12:01</td>
                            <td className='border-r-[1] border-gray-400'>12:59</td>
                            <td className='border-r-[1] border-gray-400'>5:01</td>
                            <td className='border-r-[1] border-gray-400'>5:01</td>
                            <td className='border-r-[1] border-gray-400'>6:00</td>
                            <td className='border-r-[1] border-gray-400'>9</td>
                            <td>Present</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}