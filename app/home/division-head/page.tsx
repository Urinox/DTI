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
import { useRouter } from "next/navigation"
import Loading from "@/components/Loading"
import axios from "axios"

export default function HomePage() {
    const [profile, setProfile] = useState(false)
    const [settings, setSettings] = useState(false)
    const [overtime, setOvertime] = useState(true)
    const [passSlip, setPassSlip] = useState(false)
    const [travelOrder, setTravelOrder] = useState(false)
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        division: "",
        designation: "",
        office: ""
    })
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
            fetchProfileData()
        }
    }, [session, status, router])

    async function fetchProfileData() {
        try {
            const response = await axios.get(`/api/profile/${session?.user?.id}`)
            if (response.data.data) {
                setProfileData({
                    name: response.data.data.name || "",
                    email: response.data.data.email || "",
                    division: response.data.data.division || "",
                    designation: response.data.data.designation || "",
                    office: response.data.data.office || ""
                })
            }
        } catch (error) {
            console.error("Error fetching profile:", error)
        }
    }

    function toggleBtn(btn: string) {
        setProfile(btn == 'profile')
        setSettings(btn == 'settings')
        setOvertime(btn == 'overtime')
        setPassSlip(btn == 'pass_slip')
        setTravelOrder(btn == 'travel_order')
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
                            onClick={() => toggleBtn('overtime')}
                        />
                        <SidebarButton 
                            btnIcon='pass_slip.png' 
                            btnText='Pass Slip' 
                            selected={passSlip} 
                            onClick={() => toggleBtn('pass_slip')}
                        />
                        <SidebarButton 
                            btnIcon='travel_order.png' 
                            btnText='Travel Order' 
                            selected={travelOrder} 
                            onClick={() => toggleBtn('travel_order')}
                        />
                    </div>
                    <div className='flex flex-col w-full gap-2'>
                        <SidebarButton 
                            btnIcon='user.svg' 
                            btnText='Profile' 
                            selected={profile} 
                            onClick={() => toggleBtn('profile')}
                        />
                        <SidebarButton 
                            btnIcon='setting.png' 
                            btnText='Settings' 
                            selected={settings} 
                            onClick={() => toggleBtn('settings')}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content - Old Design */}
            <div className='flex flex-1'>
                {settings && <SettingContent username={username || "User"} id={id || ""} />}
                {profile && <ProfileContent 
                    username={username || "User"} 
                    profileData={profileData} 
                    id={id || ""} 
                    getProfile={fetchProfileData} 
                />}
                {overtime && <OvertimeContent />}
                {passSlip && <PassSlipContent />}
                {travelOrder && <TravelOrderContent />}
            </div>
        </div>
    )
}