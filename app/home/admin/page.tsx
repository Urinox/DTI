"use client"
import SettingContent from "@/components/SettingContent"
import ProfileContent from "@/components/ProfileContent"
import DropdownButton from "@/components/DropdownButton"
import Image from "next/image"
import SidebarButton from "@/components/SidebarButton"
import {useState, useEffect} from "react"
import DTRManagerContent from "@/components/Admin/Content/DTRManagerContent"
import CalendarContent from "@/components/Admin/Content/CalendarContent"
import { useSession } from "next-auth/react"
import axios from "axios"

export default function HomePage() {
    const [profile, setProfile] = useState(false)
    const [settings, setSettings] = useState(false)
    const [dropdown, setDropdown] = useState(true)
    const [manageDTR, setManageDTR] = useState(true)
    const [calendar, setCalendar] = useState(false)
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        division: "",
        designation: "",
        office: ""
    })
    
// In HomePage component
const { data: session } = useSession()

useEffect(() => {
    console.log('Full Session:', session)
    console.log('User ID:', session?.user?.id)
    console.log('Username:', session?.user?.username)
    console.log('Role:', session?.user?.role)
    
    if (session?.user?.id) {
        fetchProfileData()
    }
}, [session])

async function fetchProfileData() {
    try {
        console.log('Fetching profile for user ID:', session?.user?.id)
        const response = await axios.get(`/api/profile/${session?.user?.id}`)
        console.log('Profile API Response:', response.data)
        
        if (response.data.data) {
            // Check if the profile data is actually for Francis
            console.log('Profile data received:', response.data.data)
            
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

    function toggleBtn(btn:string){
        setProfile(btn == 'profile')
        setSettings(btn == 'settings')
        setManageDTR(btn == 'manage_dtr')
        setCalendar(btn == 'calendar')
    }

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
                                <DropdownButton onClick={() => {toggleBtn('manage_dtr')}} btnText='DTR Manager' selected={manageDTR}/>
                                <DropdownButton onClick={() => {toggleBtn('calendar')}} btnText='Calendar' selected={calendar}/>
                            </div> :
                            ''
                        }
                    </div>
                    <div className='flex flex-col w-full gap-2'>
                        <SidebarButton btnIcon='user.svg' btnText='Profile' selected={profile} onClick={() => toggleBtn('profile')}/>
                        <SidebarButton btnIcon='setting.png' btnText='Settings' selected={settings} onClick={() => toggleBtn('settings')}/>
                    </div>
                </div>
            </div>
            <div className='flex flex-1'>
                {manageDTR? <DTRManagerContent/> : ''}
                {calendar? <CalendarContent/> : ''}
                {settings? <SettingContent id={session?.user?.id || ""} username={session?.user?.username || "Jeydeee"}/> : ''}
                {profile? <ProfileContent 
                    id={session?.user?.id || ""} 
                    username={session?.user?.username || "Jeydeee"} 
                    profileData={profileData}
                    getProfile={fetchProfileData}
                /> : ''}
            </div>
        </div>
    )
}