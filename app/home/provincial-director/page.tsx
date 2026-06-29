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
import {useRouter, useSearchParams} from "next/navigation";

interface Profile {
    name: string;
    email: string;
    division: string;
    designation: string;
    office: string;
}

export default function ProvincialDirectorDashboard() {
    const searchParams = useSearchParams()
    const page = searchParams.get('page') || 'overtime'
    
    const [profile, setProfile] = useState(page === 'profile')
    const [settings, setSettings] = useState(page === 'settings')
    const [overtime, setOvertime] = useState(page === 'overtime')
    const [passSlip, setPassSlip] = useState(page === 'pass_slip')
    const [travelOrder, setTravelOrder] = useState(page === 'travel_order')

    const {data: session, status} = useSession()
    const router = useRouter()

    const [username, setUsername] = useState('')
    const [id, setId] = useState('')

    function checkUser(){
        if(status === 'unauthenticated') {
            router.push('/')
        }
    }

    // Update state when URL parameter changes
    useEffect(() => {
        toggleBtn(page)
    }, [page])

    useEffect(() => {
        checkUser()
        if(session?.user) {
            setId(session.user.id)
            setUsername(session.user.username)
        }
    }, [session, status]);

    if(status === 'loading' || !session) return <Loading/>

    function toggleBtn(btn:string){
        setProfile(btn === 'profile')
        setSettings(btn === 'settings')
        setOvertime(btn === 'overtime')
        setPassSlip(btn === 'pass_slip')
        setTravelOrder(btn === 'travel_order')
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
                            href="/home/provincial-director?page=overtime"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='pass_slip.png' 
                            btnText='Pass Slip' 
                            selected={passSlip} 
                            href="/home/provincial-director?page=pass_slip"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='travel_order.png' 
                            btnText='Travel Order' 
                            selected={travelOrder} 
                            href="/home/provincial-director?page=travel_order"
                            forceReload={true}
                        />
                    </div>
                    <div className='flex flex-col w-full gap-1 px-3'>
                        <SidebarButton 
                            btnIcon='user.svg' 
                            btnText='Profile' 
                            selected={profile} 
                            href="/home/provincial-director?page=profile"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='setting.png' 
                            btnText='Settings' 
                            selected={settings} 
                            href="/home/provincial-director?page=settings"
                            forceReload={true}
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
                    <ProfileContent />
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