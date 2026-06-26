import Image from "next/image"
import {signOut} from "next-auth/react"

export default function ContentHeader({username} : {username: string}) {
    return(
        <div className='flex bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] py-5 px-10 text-white items-center justify-between'>
            <div className='flex gap-5 items-center'>
                <div className='flex flex-col gap-1 items-center justify-center text-[rgba(3,7,61,1)] bg-gray-200 px-3 py-3 rounded-xl'>
                    <Image src='/profile.svg' width={40} height={40} alt='Profile'/>
                </div>
                <div>
                    <p className='font-bold text-3xl'>Welcome back, {username}</p>
                    <p className='font-semibold text-gray-300 italic text-sm'>Everyday is a new chance to make progress</p>
                </div>
            </div>
            <Image onClick={signOut} className='cursor-pointer' src='/logout.svg' width={40} height={40} alt='logout'/>
        </div>
    )
}