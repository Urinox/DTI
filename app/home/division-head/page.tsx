// app/home/division-head/page.tsx
"use client"

import SettingContent from "@/components/SettingContent"
import ProfileContent from "@/components/ProfileContent"
import Image from "next/image"
import SidebarButton from "@/components/SidebarButton"
import OvertimeContent from "@/components/Division Head/Content/OvertimeContent"
import PassSlipContent from "@/components/Division Head/Content/PassSlipContent"
import TravelOrderContent from "@/components/Division Head/Content/TravelOrderContent"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Loading from "@/components/Loading"
import axios from "axios"

export default function HomePage() {
    const searchParams = useSearchParams()
    const page = searchParams.get('page') || 'overtime'
    
    const [profile, setProfile] = useState(page === 'profile')
    const [settings, setSettings] = useState(page === 'settings')
    const [overtime, setOvertime] = useState(page === 'overtime')
    const [passSlip, setPassSlip] = useState(page === 'pass_slip')
    const [travelOrder, setTravelOrder] = useState(page === 'travel_order')
    const [username, setUsername] = useState('')
    const [id, setId] = useState('')

    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/')
        }
        
        if (session?.user?.id) {
            setId(session.user.id)
            setUsername(session.user.username || 'User')
        }
    }, [session, status, router])

    // Update state when URL parameter changes
    useEffect(() => {
        toggleBtn(page)
    }, [page])

    function toggleBtn(btn: string) {
        setProfile(btn === 'profile')
        setSettings(btn === 'settings')
        setOvertime(btn === 'overtime')
        setPassSlip(btn === 'pass_slip')
        setTravelOrder(btn === 'travel_order')
    }

    if (status === 'loading') {
        return <Loading />
    }

    if (status === 'unauthenticated') {
        router.push('/')
        return null
    }

    return (
        <div className='flex'>
            {/* Sidebar - Old Design */}
            <div className='flex flex-col h-screen bg-black sticky top-0 w-56'>
                <div className='border-b-2 border-gray-800 mx-7 flex justify-center'>
                    <Image 
                        className='bg-gray-200 my-5 p-2 rounded-lg' 
                        src={'/dti_logo.png'} 
                        width={80} 
                        height={80} 
                        alt='DTI Logo'
                    />
                </div>
                <div className='flex flex-col justify-between flex-1 mb-10'>
                    <div className='flex flex-col w-full mt-2'>
                        <SidebarButton 
                            btnIcon='overtime.png' 
                            btnText='Overtime' 
                            selected={overtime} 
                            href="/home/division-head?page=overtime"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='pass_slip.png' 
                            btnText='Pass Slip' 
                            selected={passSlip} 
                            href="/home/division-head?page=pass_slip"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='travel_order.png' 
                            btnText='Travel Order' 
                            selected={travelOrder} 
                            href="/home/division-head?page=travel_order"
                            forceReload={true}
                        />
                    </div>
                    <div className='flex flex-col w-full gap-2'>
                        <SidebarButton 
                            btnIcon='user.svg' 
                            btnText='Profile' 
                            selected={profile} 
                            href="/home/division-head?page=profile"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='setting.png' 
                            btnText='Settings' 
                            selected={settings} 
                            href="/home/division-head?page=settings"
                            forceReload={true}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content - Old Design */}
            <div className='flex flex-1'>
                {settings && <SettingContent username={username || "User"} id={id || ""} />}
                {profile && <ProfileContent />}
                {overtime && <OvertimeContent />}
                {passSlip && <PassSlipContent />}
                {travelOrder && <TravelOrderContent />}
            </div>
        </div>
    )
}