// app/home/[role]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import axios from "axios"

// Import dashboards - go up one level to access the role folders
import AdminDashboard from "../admin/page"
import ProvincialDirectorDashboard from "../provincial-director/page"
import CosJoDashboard from "../cos-jo/page"
import DivisionHeadDashboard from "../division-head/page"

export default function RoleDashboard() {
    const params = useParams()
    const role = params?.role as string || 'cos-jo'
    const { data: session, status } = useSession()
    const router = useRouter()
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        division: "",
        designation: "",
        office: ""
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/')
            return
        }
        
        if (session?.user?.id) {
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

    if (status === 'loading') {
        return <Loading />
    }

    // Map roles to components
    const roleMap: { [key: string]: React.ComponentType<any> } = {
        'admin': AdminDashboard,
        'provincial-director': ProvincialDirectorDashboard,
        'cos-jo': CosJoDashboard,
        'division-head': DivisionHeadDashboard,
        'cos': CosJoDashboard, // Also handle 'cos' role
        'division': DivisionHeadDashboard, // Also handle 'division' role
        'sub': ProvincialDirectorDashboard, // Also handle 'sub' role
    }

    const DashboardComponent = roleMap[role] || CosJoDashboard

    return <DashboardComponent />
}