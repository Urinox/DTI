// app/home/provincial-director/page.tsx
"use client"

import SettingContent from "@/components/SettingContent"
import ProfileContent from "@/components/ProfileContent"
import Image from "next/image"
import SidebarButton from "@/components/SidebarButton"
import OvertimeContent from "@/components/Provincial Director/Content/OvertimeContent"
import PassSlipContent from "@/components/Provincial Director/Content/PassSlipContent"
import TravelOrderContent from "@/components/Provincial Director/Content/TravelOrderContent"
import {useEffect, useState} from "react"
import axios from "axios";
import {useSession} from "next-auth/react";
import Loading from "@/components/Loading";
import {useRouter} from "next/navigation";

interface Profile {
    name: string;
    email: string;
    division: string;
    designation: string;
    office: string;
}

export default function ProvincialDirectorDashboard() {
    const [profile, setProfile] = useState(false)
    const [settings, setSettings] = useState(false)
    const [overtime, setOvertime] = useState(true)
    const [passSlip, setPassSlip] = useState(false)
    const [travelOrder, setTravelOrder] = useState(false)

    const {data: session, status} = useSession()
    const router = useRouter()

    const [profileData, setProfileData] = useState<Profile>({
        name: "",
        email: "",
        division: "",
        designation: "",
        office: ""
    })
    const [username, setUsername] = useState('')
    const [id, setId] = useState('')

    function checkUser(){
        if(status === 'unauthenticated') {
            router.push('/')
        }
    }

    async function getProfile(){
        if (!id) return
        try{
            const data = await axios.get(`/api/profile/${id}`)
            if (data.data.data) {
                setProfileData(data.data.data)
            }
        } catch(err){
            console.log(err)
        }
    }

    useEffect(() => {
        checkUser()
        if(session?.user) {
            setId(session.user.id)
            setUsername(session.user.username)
            
            if (session.user.id) {
                getProfile()
            }
        }
    }, [session, status]);

    if(status === 'loading' || !session) return <Loading/>

    function toggleBtn(btn:string){
        setProfile(btn == 'profile')
        setSettings(btn == 'settings')
        setOvertime(btn == 'overtime')
        setPassSlip(btn == 'pass_slip')
        setTravelOrder(btn == 'travel_order')
    }

    return(
        <div className='flex h-screen overflow-hidden'>
            {/* Sidebar */}
            <div className='flex flex-col h-screen bg-black sticky top-0 w-56 min-w-[224px] border-r border-gray-800'>
                <div className='border-b border-gray-800 mx-7 flex justify-center'>
                    <Image className='bg-gray-200 my-5 p-2 rounded-lg' src={'/dti_logo.png'} width={80} height={80} alt='DTI Logo'/>
                </div>
                <div className='flex flex-col justify-between flex-1 mb-10'>
                    <div className='flex flex-col w-full mt-2 px-3'>
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
                    <div className='flex flex-col w-full gap-1 px-3'>
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

            {/* Main Content */}
            <div className='flex-1 overflow-y-auto bg-gray-50'>
                {settings && (
                    <SettingContent 
                        id={id} 
                        username={username} 
                    />
                )}
                {profile && (
                    <ProfileContent 
                        id={id} 
                        username={username}
                        profileData={profileData}
                        getProfile={getProfile}
                    />
                )}
                {overtime && (
                    <OvertimeContent 
                        username={username}
                    />
                )}
                {passSlip && (
                    <PassSlipContent 
                        username={username}
                    />
                )}
                {travelOrder && (
                    <TravelOrderContent 
                        username={username}
                    />
                )}
            </div>
        </div>
    )
}