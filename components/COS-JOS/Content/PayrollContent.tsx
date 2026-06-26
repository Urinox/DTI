import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState } from "react"

export default function PayrollContent({username}:{username: string}) {
    const [show, setShow] = useState(false)

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader username={username}/>
            <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                <p className='font-bold text-xl ml-5'>Payslips</p>
                <div className='flex flex-col mb-3 mt-5 border-b-2 border-gray-300'>
                    <table className='table-fixed w-full text-gray-600'>
                        <thead className='bg-gray-200 border-y-2 border-gray-300'>
                        <tr>
                            <td className='pl-10 py-1 font-bold'>Payroll Date</td>
                            <td className='pl-10 font-bold'>Basic</td>
                            <td className='pl-10 font-bold'>Deductions</td>
                            <td className='pl-10 font-bold'>Salary</td>
                            <td className='pl-10 font-bold w-36'>Action</td>
                        </tr>
                        </thead>
                        <tbody>
                        {[...Array(8)].map((_, i) => (
                            <tr key={i} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                                <td className='py-1 pl-10'>July 7, 2025</td>
                                <td className='pl-10'>20,000.00</td>
                                <td className='pl-10'>20,000.00</td>
                                <td className='pl-10'>20,000.00</td>
                                <td className='pl-10'>
                                    <button className='text-sm bg-blue-200 text-blue-800 font-bold border-2 border-blue-800 rounded-lg px-2 cursor-pointer my-2'>
                                    View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className='flex justify-between items-center text-sm font-bold text-gray-600 px-8'>
                    <p>Pages 1 of 10</p>
                    <div className='flex gap-3'>
                        <button className='cursor-pointer'><Image src='/arrow-left.svg' width={14} height={14} alt='arrow-left'/></button>
                        <p>1</p>
                        <button className='cursor-pointer'><Image src='/arrow-right.svg' width={14} height={14} alt='arrow-right'/></button>
                    </div>
                </div>
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${show ? 'flex' : 'hidden'}`}>

            </div>
        </div>
    )
}