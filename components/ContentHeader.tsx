// components/ContentHeader.tsx
import Image from "next/image"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function ContentHeader({username, displayName, userId} : {username?: string, displayName?: string, userId?: string}) {
    const { data: session } = useSession()
    const router = useRouter()
    
    // ✅ Use session username as fallback if prop is 'User' or undefined
    const sessionUsername = session?.user?.username || session?.user?.name || 'User'
    const finalUsername = (username && username !== 'User') ? username : sessionUsername
    
    // Use displayName or username, with fallback
    const nameToShow = displayName || finalUsername || 'User'

    // Safe capitalize function
    const capitalizeName = (name: string) => {
        if (!name) return 'User'
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    }

    async function handleLogout() {
        await signOut({ redirect: false })
        router.push('/')
    }

    return(
        <div className='flex bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] py-5 px-10 text-white items-center justify-between'>
            <div className='flex gap-5 items-center'>
                <div>
                    <p className='font-bold text-3xl'>Welcome back, {capitalizeName(nameToShow)}</p>
                    <p className='font-semibold text-gray-300 italic text-sm'>Everyday is a new chance to make progress</p>
                </div>
            </div>
            <Image 
                onClick={handleLogout} 
                className='cursor-pointer' 
                src='/logout.svg' 
                width={40} 
                height={40} 
                alt='logout'
            />
        </div>
    )
}