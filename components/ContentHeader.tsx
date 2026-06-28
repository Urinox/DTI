// components/ContentHeader.tsx
import Image from "next/image"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

export default function ContentHeader() {
    const { data: session } = useSession()
    const router = useRouter()
    const [displayName, setDisplayName] = useState('User')
    
    // ✅ Get username from session
    const username = session?.user?.username || session?.user?.name || 'User'

    // ✅ Fetch the actual username from database
    useEffect(() => {
        const fetchUsername = async () => {
            if (!session?.user?.id) return
            
            try {
                const response = await axios.get(`/api/profile/${session.user.id}`)
                if (response.data?.data) {
                    const userData = response.data.data
                    // ✅ Use username from database, fallback to session username
                    const dbUsername = userData.username || userData.profile?.name || username
                    setDisplayName(dbUsername)
                } else {
                    setDisplayName(username)
                }
            } catch (error) {
                console.error('Error fetching username:', error)
                setDisplayName(username)
            }
        }
        
        fetchUsername()
    }, [session, username])

    // ✅ Properly capitalize each word in the name (e.g., "george patrick t. salva" → "George Patrick T. Salva")
    const formatName = (name: string) => {
        if (!name) return 'User'
        
        // Split by spaces and capitalize each word
        return name
            .split(' ')
            .map(word => {
                // Handle special cases like "t." → "T."
                if (word.includes('.')) {
                    return word.charAt(0).toUpperCase() + word.slice(1)
                }
                // Capitalize first letter, rest lowercase
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            })
            .join(' ')
    }

    async function handleLogout() {
        await signOut({ redirect: false })
        router.push('/')
    }

    return(
        <div className='flex bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] py-5 px-10 text-white items-center justify-between'>
            <div className='flex gap-5 items-center'>
                <div>
                    <p className='font-bold text-3xl'>Welcome back, {formatName(displayName)}</p>
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