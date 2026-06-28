"use client"
import DTRContent from "@/components/COS-JOS/Content/DTRContent"
import OvertimeContent from "@/components/COS-JOS/Content/OvertimeContent"
import PassSlipContent from "@/components/COS-JOS/Content/PassSlipContent"
import TravelOrderContent from "@/components/COS-JOS/Content/TravelOrderContent"
import PayrollContent from "@/components/COS-JOS/Content/PayrollContent"
import ProfileContent from "@/components/ProfileContent"
import SettingContent from "@/components/SettingContent"
import Image from "next/image"
import SidebarButton from "@/components/SidebarButton"
import {useState, useEffect} from "react"
import {useSession} from "next-auth/react"
import Loading from "@/components/Loading"
import axios from "axios"
import {useRouter} from "next/navigation"

interface Profile {
    name: string;
    email: string;
    division: string;
    designation: string;
    office: string;
}

interface OvertimeRequest {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    status: string;
}

interface PassSlip {
    id: string;
    date: string;
    purpose: string;
    destination: string;
    type: string;
    status: string;
}

interface TravelOrder {
    id: string;
    startDate: string;
    endDate: string;
    purpose: string;
    expectedOutput: string;
    destination: string;
    status: string;
}

export default function HomePage() {
    const [dtr, setDtr] = useState(true)
    const [overtime, setOvertime] = useState(false)
    const [passSlip, setPassSlip] = useState(false)
    const [travelOrder, setTravelOrder] = useState(false)
    const [payroll, setPayroll] = useState(false)
    const [profile, setProfile] = useState(false)
    const [settings, setSettings] = useState(false)

    const {data: session, status} = useSession()
    const router = useRouter()

    const [profileData, setProfileData] = useState<Profile>({
        name: "",
        email: "",
        division: "",
        designation: "",
        office: ""
    })
    const [overtimeRequest, setOvertimeRequest] = useState<OvertimeRequest[]>([])
    const [passSlipData, setPassSlipData] = useState<PassSlip[]>([])
    const [travelOrderData, setTravelOrderData] = useState<TravelOrder[]>([])
    const [username, setUsername] = useState('')
    const [id, setId] = useState('')

    function checkUser(){
        if(status === 'unauthenticated') {
            router.push('/')
        } else if(session?.user) {
            if(session.user.role !== "cos-jo"){
                router.push(`/home/${session.user.role}`)
            }
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

    async function getOvertimeRequest(){
        if (!id) return
        try{
            const data = await axios.get(`/api/overtime_request/${id}`)
            setOvertimeRequest(data.data.data || [])
        } catch(err){
            console.log(err)
        }
    }

    async function getTravelOrder(){
        if (!id) return
        try{
            const data = await axios.get(`/api/travel_order/${id}`)
            setTravelOrderData(data.data.data || [])
        } catch(err){
            console.log(err)
        }
    }

    async function getPassSlip(){
        if (!id) return
        try{
            const data = await axios.get(`/api/pass_slip/${id}`)
            setPassSlipData(data.data.data || [])
        } catch(err){
            console.log(err)
        }
    }

    async function getPayroll(){
        console.log('Fetching payroll...')
    }

    useEffect(() => {
        checkUser()
        if(session?.user) {
            setId(session.user.id)
            setUsername(session.user.username)
            
            if (session.user.id) {
                getProfile()
                getOvertimeRequest()
                getTravelOrder()
                getPassSlip()
                getPayroll()
            }
        }
    }, [session, status]);

    if(status === 'loading' || !session) return <Loading/>

    function toggleBtn(btn:string){
        setDtr(btn == 'dtr')
        setOvertime(btn == 'overtime')
        setPassSlip(btn == 'pass_slip')
        setTravelOrder(btn == 'travel_order')
        setPayroll(btn == 'payroll')
        setProfile(btn == 'profile')
        setSettings(btn == 'settings')
    }

    if(status == 'authenticated'){
        return(
            <div className='flex'>
                <div className='flex flex-col h-screen bg-black sticky top-0'>
                    <div className='border-b-2 border-gray-800 mx-7 flex justify-center'>
                        <Image className='bg-gray-200 my-5 p-2 rounded-lg' src={'/dti_logo.png'} width={80} height={80} alt={''}/>
                    </div>
                    <div className='flex flex-col justify-between flex-1 mb-10'>
                        <div className='flex flex-col w-full mt-2 gap-2'>
                            <SidebarButton btnIcon='dtr.png' btnText='DTR' selected={dtr} onClick={() => toggleBtn('dtr')}/>
                            <SidebarButton btnIcon='overtime.png' btnText='Overtime' selected={overtime} onClick={() => toggleBtn('overtime')}/>
                            <SidebarButton btnIcon='pass_slip.png' btnText='Pass Slip' selected={passSlip} onClick={() => toggleBtn('pass_slip')}/>
                            <SidebarButton btnIcon='travel_order.png' btnText='Travel Order' selected={travelOrder} onClick={() => toggleBtn('travel_order')}/>
                            <SidebarButton btnIcon='payroll.png' btnText='Payroll' selected={payroll} onClick={() => toggleBtn('payroll')}/>
                        </div>
                        <div className='flex flex-col w-full gap-2'>
                            <SidebarButton btnIcon='user.svg' btnText='Profile' selected={profile} onClick={() => toggleBtn('profile')}/>
                            <SidebarButton btnIcon='setting.png' btnText='Settings' selected={settings} onClick={() => toggleBtn('settings')}/>
                        </div>
                    </div>
                </div>
                <div className='flex flex-1'>
                    {dtr? <DTRContent username={username} userId={id} /> : ''}
                    {overtime? <OvertimeContent username={username} overtimeRequest={overtimeRequest} id={id} getOvertimeRequest={getOvertimeRequest} /> : ''}
                    {passSlip? <PassSlipContent username={username} id={id} passSlip={passSlipData} getPassSlip={getPassSlip} /> : ''}
                    {travelOrder? <TravelOrderContent username={username} id={id} travelOrder={travelOrderData} getTravelOrder={getTravelOrder} /> : ''}
                    {payroll? <PayrollContent username={username} /> : ''}
                    {profile && <ProfileContent 
                        username={profileData.name || username} 
                        profileData={profileData} 
                        id={id} 
                        getProfile={getProfile}
                    />}
                    {settings && <SettingContent username={username} id={id} />}
                </div>
            </div>
        )
    }
}