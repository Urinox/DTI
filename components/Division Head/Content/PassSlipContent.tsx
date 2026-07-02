// components/Division Head/Content/PassSlipContent.tsx
import ContentHeader from "@/components/ContentHeader"
import PassSlipCard from "@/components/Division Head/Cards/PassSlipCard"
import { useState, useEffect } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"

interface PassSlipContentProps {
    username?: string
}

export default function PassSlipContent({ username = 'User' }: PassSlipContentProps) {
    const { data: session } = useSession()
    const [passSlipData, setPassSlipData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All')
    const [show, setShow] = useState(false)
    const [userOffice, setUserOffice] = useState<string>('')

    useEffect(() => {
        fetchPassSlipData()
        getUserOffice()
    }, [])

    async function getUserOffice() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/profile/${session.user.id}`)
            const profileData = response.data.data
            const office = profileData?.profile?.office || profileData?.office || ''
            setUserOffice(office)
        } catch (error) {
            console.error('Error fetching user office:', error)
        }
    }

    async function fetchPassSlipData() {
        try {
            if (!session?.user?.id) return
            
            console.log('🔍 Fetching pass slips for user:', session.user.id)
            console.log('🔍 User role:', session.user.role)
            
            const response = await axios.get(`/api/pass_slip/${session.user.id}`)
            console.log('📋 Full API Response:', response.data)
            
            const data = response.data.data || []
            console.log('📋 Pass slip data:', data)
            console.log('📋 Data length:', data.length)
            
            setPassSlipData(data)
        } catch (error) {
            console.error('Error fetching pass slip data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove(requestId: string) {
        try {
            const profileResponse = await axios.get(`/api/profile/${session?.user?.id}`)
            const userData = profileResponse.data.data
            const profile = userData?.profile || userData || {}
            
            const approvedByName = profile.name || session?.user?.profile?.name || session?.user?.name || 'Division Head'
            const approvedByDesignation = profile.designation || session?.user?.profile?.designation || 'Division Head'

            const response = await axios.put('/api/pass_slip/update', {
                requestId,
                status: 'Pending Provincial',
                approvedBy: session?.user?.id,
                approvedByName: approvedByName,
                approvedByDesignation: approvedByDesignation
            })
            
            if (response.status === 200) {
                alert('✅ Pass slip approved and sent to Provincial Director!')
                fetchPassSlipData()
            }
        } catch (error: any) {
            console.error('Error approving pass slip:', error)
            alert(error.response?.data?.message || '❌ Error approving pass slip')
        }
    }

    async function handleDisapprove(requestId: string) {
        try {
            const profileResponse = await axios.get(`/api/profile/${session?.user?.id}`)
            const userData = profileResponse.data.data
            const profile = userData?.profile || userData || {}
            
            const approvedByName = profile.name || session?.user?.profile?.name || session?.user?.name || 'Division Head'
            const approvedByDesignation = profile.designation || session?.user?.profile?.designation || 'Division Head'

            const response = await axios.put('/api/pass_slip/update', {
                requestId,
                status: 'Disapproved',
                approvedBy: session?.user?.id,
                approvedByName: approvedByName,
                approvedByDesignation: approvedByDesignation
            })
            
            if (response.status === 200) {
                alert('❌ Pass slip disapproved')
                fetchPassSlipData()
            }
        } catch (error: any) {
            console.error('Error disapproving pass slip:', error)
            alert(error.response?.data?.message || '❌ Error disapproving pass slip')
        }
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(e.target.value)
    }

    const statusFilteredData = filter === 'All' 
        ? passSlipData 
        : passSlipData.filter(item => {
            const itemStatus = item.status || item.Status || ''
            return itemStatus === filter || 
                   itemStatus.toLowerCase() === filter.toLowerCase()
        })

    const filteredData = statusFilteredData.filter(item => {
        const itemOffice = item.office || ''
        if (!userOffice) return true
        return itemOffice.toLowerCase() === userOffice.toLowerCase()
    })

    if (loading) {
        return (
            <div className={`flex flex-col w-full ${show ? 'overflow-hidden h-screen' : ''}`}>
                <ContentHeader />
                <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black shadow-xl shadow-gray-500/30'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className={`flex flex-col w-full bg-gray-200 ${show ? 'overflow-hidden h-screen' : ''}`}>
            <ContentHeader />
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black shadow-xl shadow-gray-500/30'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <div className='flex items-center gap-4'>
                        <select 
                            className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'
                            value={filter}
                            onChange={handleFilterChange}
                        >
                            <option>All</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Disapproved</option>
                        </select>
                    </div>
                    <span className='text-sm text-gray-500'>
                        {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
                    </span>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {filteredData.length === 0 ? (
                        <div className='text-center text-gray-500 py-10'>
                            {userOffice ? (
                                <p>No pass slip requests found for <strong>{userOffice}</strong></p>
                            ) : (
                                <p>No pass slip requests found</p>
                            )}
                        </div>
                    ) : (
                        filteredData.map((item) => (
                            <PassSlipCard 
                                key={item.id || item._id} 
                                info={item}
                                onApprove={() => handleApprove(item.id || item._id)}
                                onDisapprove={() => handleDisapprove(item.id || item._id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}