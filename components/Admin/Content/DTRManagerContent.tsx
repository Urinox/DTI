import ContentHeader from "@/components/ContentHeader"
import Image from "next/image";
import {hidden} from "next/dist/lib/picocolors";

export default function DTRManagerContent() {
    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col bg-white h-full py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                <p className='font-bold text-xl ml-5'>Employee Accounts</p>
                <div className='flex flex-col h-full mb-3 mt-5 border-b-2 border-gray-300'>
                    <table className='table-fixed w-full h-full text-gray-600'>
                        <thead className='bg-gray-200 border-y-2 border-gray-300'>
                        <tr>
                            <td className='pl-10 py-1 font-bold w-40'>Employee ID</td>
                            <td className='pl-10 font-bold'>Name</td>
                            <td className='pl-10 font-bold'>Email</td>
                            <td className='pl-10 font-bold w-40'>Designation</td>
                            <td className='pl-10 font-bold w-40'>Action</td>
                        </tr>
                        </thead>
                        <tbody>
                        {[...Array(8)].map((_, i) => (
                            <tr key={i} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                                <td className='pl-10'>{i == 0 ? '12345' : ''}</td>
                                <td className='pl-10'>{i == 0 ? 'John Dominique Gonzales' : ''}</td>
                                <td className='pl-10'>{i == 0 ? 'jd04gonzales@gmail.com' : ''}</td>
                                <td className='pl-10'>{i == 0 ? 'Office' : ''}</td>
                                <td className='pl-10 flex items-center gap-5 py-2'>
                                    {i == 0 ? <Image className='cursor-pointer' src='/edit.svg' width={20} height={20} alt='edit'/> :
                                        <div className='w-5 h-5'></div>}
                                    {i == 0 ? <Image className='cursor-pointer' src='/delete.svg' width={20} height={20} alt='delete'/> :
                                        <div className='w-5 h-5'></div>}
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
        </div>
    )
}