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

interface Profile {
    name: string;
    email: string;
    division: string;
    designation: string;
    office: string;
}

export default function HomePage() {
    const [profile, setProfile] = useState(false)
    const [settings, setSettings] = useState(false)
    const [overtime, setOvertime] = useState(true)
    const [passSlip, setPassSlip] = useState(false)
    const [travelOrder, setTravelOrder] = useState(false)

    const {data: session, status} = useSession()

    const [profileData, setProfileData] = useState<Profile>({})
    const [overtimeRequest, setOvertimeRequest] = useState([])
    const [passSlipData, setPassSlipData] = useState([])
    const [travelOrderData, setTravelOrderData] = useState([])
    const [username, setUsername] = useState('')
    const [id, setId] = useState('')

    function checkUser(){
        if(status === 'unauthenticated') {
            window.location.href = '/'
        }else if(session){
            if(session.user.role != "cos-jo"){
                window.location.href = `/home/${session.user.role}`
            }
        }
    }

    async function getProfile(){
        try{
            const data = await axios.get(`/api/profile/${id}`)
            setProfileData(data.data.data)
        } catch(err){
            console.log(err)
        }
    }

    async function getOvertimeRequest(){
        try{
            const data = await axios.get(`/api/overtime_request/${id}`)
            setOvertimeRequest(data.data.data)
        } catch(err){
            console.log(err)
        }
    }

    async function getTravelOrder(){
        try{
            const data = await axios.get(`/api/travel_order/${id}`)
            setTravelOrderData(data.data.data)
        } catch(err){
            console.log(err)
        }
    }

    async function getPassSlip(){
        try{
            const data = await axios.get(`/api/pass_slip/${id}`)
            setPassSlipData(data.data.data)
        } catch(err){
            console.log(err)
        }
    }

    useEffect(() => {
        checkUser()
        if(session){
            setId(session.user.id)

            setUsername(session.user.username)
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
                {overtime? <OvertimeContent username={'JD'} overtimeRequest={overtimeRequest} id={id} getOvertimeRequest={getOvertimeRequest}/> : ''}
                {passSlip? <PassSlipContent/> : ''}
                {travelOrder? <TravelOrderContent/> : ''}
            </div>
        </div>
    )
}