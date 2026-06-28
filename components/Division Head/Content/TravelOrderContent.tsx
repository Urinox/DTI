// components/Division Head/Content/TravelOrderContent.tsx
import ContentHeader from "@/components/ContentHeader"
import TravelOrderCard from "@/components/Division Head/Cards/TravelOrderCard"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface TravelOrderContentProps {
    username?: string
}

export default function TravelOrderContent({ username = 'User' }: TravelOrderContentProps) {
    const { data: session } = useSession()
    const [travelOrderData, setTravelOrderData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All')
    const [show, setShow] = useState(false)
    const [userOffice, setUserOffice] = useState<string>('')

    useEffect(() => {
        fetchTravelOrderData()
        getUserOffice()
    }, [])

    // Get the current user's office from session/profile
    async function getUserOffice() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/profile/${session.user.id}`)
            const profileData = response.data.data
            const office = profileData?.profile?.office || profileData?.office || ''
            setUserOffice(office)
            console.log('📋 User Office:', office)
        } catch (error) {
            console.error('Error fetching user office:', error)
        }
    }

    async function fetchTravelOrderData() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/travel_order/${session.user.id}`)
            const data = response.data.data || []
            
            // ✅ Show ALL travel orders (Pending, Approved, Disapproved)
            setTravelOrderData(data)
        } catch (error) {
            console.error('Error fetching travel order data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove(requestId: string) {
        try {
            const response = await axios.put('/api/travel_order/update', {
                requestId,
                status: 'Approved'
            })
            
            if (response.status === 200) {
                alert('✅ Travel order approved successfully!')
                fetchTravelOrderData()
            }
        } catch (error: any) {
            console.error('Error approving travel order:', error)
            alert(error.response?.data?.message || '❌ Error approving travel order')
        }
    }

    async function handleDisapprove(requestId: string) {
        try {
            const response = await axios.put('/api/travel_order/update', {
                requestId,
                status: 'Disapproved'
            })
            
            if (response.status === 200) {
                alert('❌ Travel order disapproved')
                fetchTravelOrderData()
            }
        } catch (error: any) {
            console.error('Error disapproving travel order:', error)
            alert(error.response?.data?.message || '❌ Error disapproving travel order')
        }
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(e.target.value)
    }

    // Filter data by status first
    const statusFilteredData = filter === 'All' 
        ? travelOrderData 
        : travelOrderData.filter(item => {
            const itemStatus = item.status || item.Status || ''
            return itemStatus === filter || 
                   itemStatus.toLowerCase() === filter.toLowerCase()
        })

    // ✅ Then filter by user's office (only show requests from their municipality)
    const filteredData = statusFilteredData.filter(item => {
        const itemOffice = item.office || item.division || ''
        // If user has no office set, show all (fallback)
        if (!userOffice) return true
        // Only show items that match the user's office
        return itemOffice.toLowerCase() === userOffice.toLowerCase()
    })

    if (loading) {
        return (
            <div className={`flex flex-col w-full bg-gray-200 ${show ? 'overflow-hidden h-screen' : ''}`}>
                <ContentHeader username={username} userId={session?.user?.id} />
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
            <ContentHeader username={username} userId={session?.user?.id} />
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
                                <>
                                    <p>No travel order requests found for <strong>{userOffice}</strong></p>
                                </>
                            ) : (
                                <p>No travel order requests found</p>
                            )}
                        </div>
                    ) : (
                        filteredData.map((item) => (
                            <TravelOrderCard 
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