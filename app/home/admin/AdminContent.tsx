// app/home/admin/AdminContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import SettingContent from "@/components/SettingContent"
import ProfileContent from "@/components/ProfileContent"
import DropdownButton from "@/components/DropdownButton"
import Image from "next/image"
import SidebarButton from "@/components/SidebarButton"
import DTRManagerContent from "@/components/Admin/Content/DTRManagerContent"
import CalendarContent from "@/components/Admin/Content/CalendarContent"
import { useSearchParams } from 'next/navigation'

export default function AdminContent() {
    const searchParams = useSearchParams()
    const page = searchParams.get('page') || 'manage_dtr'
    
    const [profile, setProfile] = useState(page === 'profile')
    const [settings, setSettings] = useState(page === 'settings')
    const [dropdown, setDropdown] = useState(true)
    const [manageDTR, setManageDTR] = useState(page === 'manage_dtr')
    const [calendar, setCalendar] = useState(page === 'calendar')
    
    const { data: session } = useSession()

    function toggleBtn(btn: string) {
        setProfile(btn === 'profile')
        setSettings(btn === 'settings')
        setManageDTR(btn === 'manage_dtr')
        setCalendar(btn === 'calendar')
    }

    // Update state when URL parameter changes
    useEffect(() => {
        toggleBtn(page)
    }, [page])

    return(
        <div className='flex'>
            <div className='flex flex-col h-screen bg-black sticky top-0 w-56'>
                <div className='border-b-2 border-gray-800 mx-7 flex justify-center'>
                    <Image className='bg-gray-200 my-5 p-2 rounded-lg' src={'/dti_logo.png'} width={80} height={80} alt={''}/>
                </div>
                <div className='flex flex-col justify-between flex-1 mb-10'>
                    <div className='flex flex-col w-full mt-2'>
                        <button onClick={() => setDropdown(!dropdown)} className={`text-white flex items-center justify-between py-2 px-10 cursor-pointer`}>
                            <div className='flex items-center gap-2'>
                                <Image src={`/dtr.png`} width={25} height={25} alt='btn'/>
                                <p className='text-lg font-semibold'>DTR</p>
                            </div>
                            <Image className={`transition-all duration-150
                            ${dropdown ? 'rotate-0' : 'rotate-90'}`} src={`/dropdown.svg`} width={15} height={15} alt='down'/>
                        </button>
                        {dropdown ?
                            <div className='flex flex-col'>
                                <DropdownButton 
                                    onClick={() => {
                                        toggleBtn('manage_dtr');
                                        window.location.href = '/home/admin?page=manage_dtr';
                                    }} 
                                    btnText='DTR Manager' 
                                    selected={manageDTR}
                                />
                                <DropdownButton 
                                    onClick={() => {
                                        toggleBtn('calendar');
                                        window.location.href = '/home/admin?page=calendar';
                                    }} 
                                    btnText='Calendar' 
                                    selected={calendar}
                                />
                            </div> :
                            ''
                        }
                    </div>
                    <div className='flex flex-col w-full gap-2'>
                        <SidebarButton 
                            btnIcon='user.svg' 
                            btnText='Profile' 
                            selected={profile} 
                            href="/home/admin?page=profile"
                            forceReload={true}
                        />
                        <SidebarButton 
                            btnIcon='setting.png' 
                            btnText='Settings' 
                            selected={settings} 
                            href="/home/admin?page=settings"
                            forceReload={true}
                        />
                    </div>
                </div>
            </div>
            <div className='flex flex-1'>
                {manageDTR ? <DTRManagerContent/> : ''}
                {calendar ? <CalendarContent/> : ''}
                {settings ? <SettingContent id={session?.user?.id || ""} username={session?.user?.username || "Admin"} /> : ''}
                {profile ? <ProfileContent /> : ''}
            </div>
        </div>
    )
}