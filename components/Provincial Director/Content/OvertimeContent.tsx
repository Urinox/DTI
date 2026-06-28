// components/Provincial Director/Content/OvertimeContent.tsx
import ContentHeader from "@/components/ContentHeader"
import OvertimeCard from "@/components/Provincial Director/Cards/OvertimeCard"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface OvertimeContentProps {
    username?: string
}

export default function OvertimeContent({ username = 'User' }: OvertimeContentProps) {
    const { data: session } = useSession()
    const [overtimeData, setOvertimeData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All')
    const [show, setShow] = useState(false)

    useEffect(() => {
        fetchOvertimeData()
    }, [])

    async function fetchOvertimeData() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/overtime_request/${session.user.id}`)
            const data = response.data.data || []
            
            // ✅ Show Pending Provincial (approved by Division Head), Approved, and Disapproved
            const filteredData = data.filter((item: any) => {
                const status = item.status || item.Status || ''
                return status === 'Pending Provincial' || 
                       status === 'Approved' ||
                       status === 'Disapproved'
            })
            
            setOvertimeData(filteredData)
        } catch (error) {
            console.error('Error fetching overtime data:', error)
        } finally {
            setLoading(false)
        }
    }

    // ✅ Provincial Director approves → sets status to 'Approved' (FINAL)
    async function handleApprove(requestId: string) {
        try {
            const response = await axios.put('/api/overtime_request/update', {
                requestId,
                status: 'Approved'  // ✅ Final approval
            })
            
            if (response.status === 200) {
                alert('✅ Overtime approved successfully!')
                fetchOvertimeData()
            }
        } catch (error: any) {
            console.error('Error approving overtime:', error)
            alert(error.response?.data?.message || '❌ Error approving overtime')
        }
    }

    // ✅ Provincial Director disapproves → sets status to 'Disapproved'
    async function handleDisapprove(requestId: string) {
        try {
            const response = await axios.put('/api/overtime_request/update', {
                requestId,
                status: 'Disapproved'
            })
            
            if (response.status === 200) {
                alert('❌ Overtime disapproved')
                fetchOvertimeData()
            }
        } catch (error: any) {
            console.error('Error disapproving overtime:', error)
            alert(error.response?.data?.message || '❌ Error disapproving overtime')
        }
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(e.target.value)
    }

    const filteredData = filter === 'All' 
        ? overtimeData 
        : overtimeData.filter(item => {
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
                            No overtime requests found
                        </div>
                    ) : (
                        filteredData.map((item) => (
                            <OvertimeCard 
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