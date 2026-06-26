"use client"
import SettingContent from "@/components/SettingContent"
import ProfileContent from "@/components/ProfileContent"
import Image from "next/image"
import SidebarButton from "@/components/SidebarButton"
import OvertimeContent from "@/components/Division Head/Content/OvertimeContent"
import PassSlipContent from "@/components/Division Head/Content/PassSlipContent"
import TravelOrderContent from "@/components/Division Head/Content/TravelOrderContent"
import {useState} from "react"

export default function HomePage() {
    const [profile, setProfile] = useState(false)
    const [settings, setSettings] = useState(false)
    const [overtime, setOvertime] = useState(true)
    const [passSlip, setPassSlip] = useState(false)
    const [travelOrder, setTravelOrder] = useState(false)

    function toggleBtn(btn:string){
        setProfile(btn == 'profile')
        setSettings(btn == 'settings')
        setOvertime(btn == 'overtime')
        setPassSlip(btn == 'pass_slip')
        setTravelOrder(btn == 'travel_order')
    }

    return(
        <div className='flex'>
            <div className='flex flex-col h-screen bg-black sticky top-0 w-56'>
                <div className='border-b-2 border-gray-800 mx-7 flex justify-center'>
                    <Image className='bg-gray-200 my-5 p-2 rounded-lg' src={'/dti_logo.png'} width={80} height={80} alt={''}/>
                </div>
                <div className='flex flex-col justify-between flex-1 mb-10'>
                    <div className='flex flex-col w-full mt-2'>
                        <SidebarButton btnIcon='overtime.png' btnText='Overtime' selected={overtime} onClick={() => toggleBtn('overtime')}/>
                        <SidebarButton btnIcon='pass_slip.png' btnText='Pass Slip' selected={passSlip} onClick={() => toggleBtn('pass_slip')}/>
                        <SidebarButton btnIcon='travel_order.png' btnText='Travel Order' selected={travelOrder} onClick={() => toggleBtn('travel_order')}/>
                    </div>
                    <div className='flex flex-col w-full gap-2'>
                        <SidebarButton btnIcon='user.svg' btnText='Profile' selected={profile} onClick={() => toggleBtn('profile')}/>
                        <SidebarButton btnIcon='setting.png' btnText='Settings' selected={settings} onClick={() => toggleBtn('settings')}/>
                    </div>
                </div>
            </div>
            <div className='flex flex-1'>
                {settings? <SettingContent username={'Jeydeee'}/> : ''}
                {profile? <ProfileContent username={'Jeydeee'}/> : ''}
                {overtime? <OvertimeContent/> : ''}
                {passSlip? <PassSlipContent/> : ''}
                {travelOrder? <TravelOrderContent/> : ''}
            </div>
        </div>
    )
}