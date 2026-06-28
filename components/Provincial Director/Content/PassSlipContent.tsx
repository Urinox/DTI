// components/Provincial Director/Content/PassSlipContent.tsx
import ContentHeader from "@/components/ContentHeader"
import PassSlipCard from "@/components/Provincial Director/Cards/PassSlipCard"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface PassSlipContentProps {
    username?: string
}

export default function PassSlipContent({ username = 'User' }: PassSlipContentProps) {
    const { data: session } = useSession()
    const [passSlipData, setPassSlipData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All')
    const [show, setShow] = useState(false)

    useEffect(() => {
        fetchPassSlipData()
    }, [])

    async function fetchPassSlipData() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/pass_slip/${session.user.id}`)
            const data = response.data.data || []
            
            // ✅ Show Pending Provincial, Approved, and Disapproved
            const filteredData = data.filter((item: any) => {
                const status = item.status || item.Status || ''
                return status === 'Pending Provincial' || 
                       status === 'Approved' ||
                       status === 'Disapproved'
            })
            
            setPassSlipData(filteredData)
        } catch (error) {
            console.error('Error fetching pass slip data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove(requestId: string) {
        try {
            const response = await axios.put('/api/pass_slip/update', {
                requestId,
                status: 'Approved'
            })
            
            if (response.status === 200) {
                alert('✅ Pass slip approved successfully!')
                fetchPassSlipData()
            }
        } catch (error: any) {
            console.error('Error approving pass slip:', error)
            alert(error.response?.data?.message || '❌ Error approving pass slip')
        }
    }

    async function handleDisapprove(requestId: string) {
        try {
            const response = await axios.put('/api/pass_slip/update', {
                requestId,
                status: 'Disapproved'
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

    const filteredData = filter === 'All' 
        ? passSlipData 
        : passSlipData.filter(item => {
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
                        <option>Disapproved</option>
                    </select>
                    <span className='text-sm text-gray-500'>
                        {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
                    </span>
                </div>
                <div className='flex flex-col py-5 gap-5'>
                    {filteredData.length === 0 ? (
                        <div className='text-center text-gray-500 py-10'>
                            No pass slip requests found
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