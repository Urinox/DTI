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
import {useRouter, useSearchParams} from "next/navigation"

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
    const searchParams = useSearchParams()
    const page = searchParams.get('page') || 'dtr'
    
    const [dtr, setDtr] = useState(page === 'dtr')
    const [overtime, setOvertime] = useState(page === 'overtime')
    const [passSlip, setPassSlip] = useState(page === 'pass_slip')
    const [travelOrder, setTravelOrder] = useState(page === 'travel_order')
    const [payroll, setPayroll] = useState(page === 'payroll')
    const [profile, setProfile] = useState(page === 'profile')
    const [settings, setSettings] = useState(page === 'settings')

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

    // Update state when URL parameter changes
    useEffect(() => {
        toggleBtn(page)
    }, [page])

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
        setDtr(btn === 'dtr')
        setOvertime(btn === 'overtime')
        setPassSlip(btn === 'pass_slip')
        setTravelOrder(btn === 'travel_order')
        setPayroll(btn === 'payroll')
        setProfile(btn === 'profile')
        setSettings(btn === 'settings')
    }

    if(status === 'authenticated'){
        return(
            <div className='flex'>
                <div className='flex flex-col h-screen bg-black sticky top-0'>
                    <div className='border-b-2 border-gray-800 mx-7 flex justify-center'>
                        <Image className='bg-gray-200 my-5 p-2 rounded-lg' src={'/dti_logo.png'} width={80} height={80} alt={''}/>
                    </div>
                    <div className='flex flex-col justify-between flex-1 mb-10'>
                        <div className='flex flex-col w-full mt-2 gap-2'>
                            <SidebarButton 
                                btnIcon='dtr.png' 
                                btnText='DTR' 
                                selected={dtr} 
                                href="/home/cos-jo?page=dtr"
                                forceReload={true}
                            />
                            <SidebarButton 
                                btnIcon='overtime.png' 
                                btnText='Overtime' 
                                selected={overtime} 
                                href="/home/cos-jo?page=overtime"
                                forceReload={true}
                            />
                            <SidebarButton 
                                btnIcon='pass_slip.png' 
                                btnText='Pass Slip' 
                                selected={passSlip} 
                                href="/home/cos-jo?page=pass_slip"
                                forceReload={true}
                            />
                            <SidebarButton 
                                btnIcon='travel_order.png' 
                                btnText='Travel Order' 
                                selected={travelOrder} 
                                href="/home/cos-jo?page=travel_order"
                                forceReload={true}
                            />
                            <SidebarButton 
                                btnIcon='payroll.png' 
                                btnText='Payroll' 
                                selected={payroll} 
                                href="/home/cos-jo?page=payroll"
                                forceReload={true}
                            />
                        </div>
                        <div className='flex flex-col w-full gap-2'>
                            <SidebarButton 
                                btnIcon='user.svg' 
                                btnText='Profile' 
                                selected={profile} 
                                href="/home/cos-jo?page=profile"
                                forceReload={true}
                            />
                            <SidebarButton 
                                btnIcon='setting.png' 
                                btnText='Settings' 
                                selected={settings} 
                                href="/home/cos-jo?page=settings"
                                forceReload={true}
                            />
                        </div>
                    </div>
                </div>
                <div className='flex flex-1'>
                    {dtr ? <DTRContent username={username} userId={id} /> : ''}
                    {overtime ? <OvertimeContent username={username} overtimeRequest={overtimeRequest} id={id} getOvertimeRequest={getOvertimeRequest} /> : ''}
                    {passSlip ? <PassSlipContent username={username} id={id} passSlip={passSlipData} getPassSlip={getPassSlip} /> : ''}
                    {travelOrder ? <TravelOrderContent username={username} id={id} travelOrder={travelOrderData} getTravelOrder={getTravelOrder} /> : ''}
                    {payroll ? <PayrollContent /> : ''}
                    {profile ? <ProfileContent /> : ''}
                    {settings ? <SettingContent username={username} id={id} /> : ''}
                </div>
            </div>
        )
    }
}