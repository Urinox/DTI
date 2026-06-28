// components/Provincial Director/Content/TravelOrderContent.tsx
import ContentHeader from "@/components/ContentHeader"
import TravelOrderCard from "@/components/Provincial Director/Cards/TravelOrderCard"
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

    useEffect(() => {
        fetchTravelOrderData()
    }, [])

    async function fetchTravelOrderData() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/travel_order/${session.user.id}`)
            const data = response.data.data || []
            
            // ✅ Show ALL travel orders (Pending, Pending Provincial, Approved by Division Head, Approved, Disapproved)
            const filteredData = data.filter((item: any) => {
                const status = item.status || item.Status || ''
                return status === 'Pending' || 
                       status === 'Pending Provincial' || 
                       status === 'Approved by Division Head' ||
                       status === 'Approved' ||
                       status === 'Disapproved'
            })
            
            setTravelOrderData(filteredData)
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

    const filteredData = filter === 'All' 
        ? travelOrderData 
        : travelOrderData.filter(item => {
            const itemStatus = item.status || item.Status || ''
            return itemStatus === filter || 
                   itemStatus.toLowerCase() === filter.toLowerCase()
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
        <div className={`flex flex-col w-full ${show ? 'overflow-hidden h-screen' : ''}`}>
            <ContentHeader username={username} userId={session?.user?.id} />
            <div className='flex flex-col my-5 mx-40 bg-white flex-1 rounded-xl border-[1] border-black shadow-xl shadow-gray-500/30'>
                <div className='flex justify-between items-center p-5 border-b-[1] border-gray-300'>
                    <select 
                        className='border-[1] border-black rounded-lg px-5 py-1 outline-0 text-sm'
                        value={filter}
                        onChange={handleFilterChange}
                    >
                        <option>All</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Disapproved</option>  {/* ✅ Added Disapproved */}
                    </select>
                    <span className='text-sm text-gray-500'>
                        {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
                    </span>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {filteredData.length === 0 ? (
                        <div className='text-center text-gray-500 py-10'>
                            No travel order requests found
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