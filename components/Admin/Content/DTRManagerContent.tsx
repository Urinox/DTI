// components/Admin/Content/DTRManagerContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface Employee {
    id: string
    employeeId: string
    username: string
    name: string
    email: string
    designation: string
    division: string
    office: string
}

interface DTRRecord {
    id: string
    employeeId: string
    employeeName: string
    date: string
    timeInAM: string
    timeOutAM: string
    timeInPM: string
    timeOutPM: string
    totalHours: string
    status: string
    locationInAM: string
    locationOutAM: string
    locationInPM: string
    locationOutPM: string
}

export default function DTRManagerContent() {
    const { data: session } = useSession()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [dtrRecords, setDtrRecords] = useState<DTRRecord[]>([])
    const [filteredRecords, setFilteredRecords] = useState<DTRRecord[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [editingRecord, setEditingRecord] = useState<string | null>(null)
    const [editingStatus, setEditingStatus] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const itemsPerPage = 10

    useEffect(() => {
        const now = new Date()
        const month = now.toISOString().slice(0, 7)
        setSelectedMonth(month)
        fetchEmployees()
    }, [session])

    useEffect(() => {
        if (employees.length > 0) {
            fetchAllDTRRecords(selectedMonth)
        }
    }, [employees, selectedMonth])

    useEffect(() => {
        filterRecords()
    }, [dtrRecords, selectedEmployee, searchTerm])

    // Focus input when editing starts
    useEffect(() => {
        if (editingRecord && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editingRecord])

    async function fetchEmployees() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get('/api/admin/employees')
            const data = response.data.data || []
            
            const formattedEmployees = data.map((user: any, index: number) => ({
                id: user.id || '',
                employeeId: (index + 1).toString().padStart(5, '0'),
                username: user.username || '',
                name: user.profile?.name || user.username || 'Unknown',
                email: user.email || '',
                designation: user.profile?.designation || 'N/A',
                division: user.profile?.division || '',
                office: user.profile?.office || ''
            }))
            
            setEmployees(formattedEmployees)
        } catch (error) {
            console.error('Error fetching employees:', error)
            setEmployees([])
        }
    }

    async function fetchAllDTRRecords(month: string) {
        setLoading(true)
        const allRecords: DTRRecord[] = []
        
        try {
            for (const employee of employees) {
                try {
                    const response = await axios.get(`/api/dtr/${employee.id}`)
                    const records = response.data.data || []
                    
                    const monthRecords = records.filter((record: any) => 
                        record.date?.startsWith(month)
                    )
                    
                    monthRecords.forEach((record: any) => {
                        allRecords.push({
                            id: record.id || '',
                            employeeId: employee.employeeId,
                            employeeName: employee.name,
                            date: record.date || '',
                            timeInAM: record.timeInAM || '',
                            timeOutAM: record.timeOutAM || '',
                            timeInPM: record.timeInPM || '',
                            timeOutPM: record.timeOutPM || '',
                            totalHours: record.totalHours || '',
                            status: record.status || 'Present',
                            locationInAM: record.locationInAM || '',
                            locationOutAM: record.locationOutAM || '',
                            locationInPM: record.locationInPM || '',
                            locationOutPM: record.locationOutPM || ''
                        })
                    })
                } catch (error) {
                    console.log(`No DTR records for ${employee.name}`)
                }
            }
            
            allRecords.sort((a, b) => b.date.localeCompare(a.date))
            setDtrRecords(allRecords)
        } catch (error) {
            console.error('Error fetching DTR records:', error)
            setDtrRecords([])
        } finally {
            setLoading(false)
        }
    }

    function filterRecords() {
        let filtered = [...dtrRecords]
        
        if (selectedEmployee !== 'all') {
            filtered = filtered.filter(record => record.employeeId === selectedEmployee)
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(record => 
                record.employeeName.toLowerCase().includes(term) ||
                record.employeeId.includes(term)
            )
        }
        
        setFilteredRecords(filtered)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRecords = filteredRecords.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // ✅ Handle double click to edit status
    function handleDoubleClick(record: DTRRecord) {
        setEditingRecord(record.id)
        setEditingStatus(record.status || '')
    }

    // ✅ Handle Enter key to save status
    async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, record: DTRRecord) {
        if (e.key === 'Enter') {
            e.preventDefault()
            await saveStatus(record)
        } else if (e.key === 'Escape') {
            setEditingRecord(null)
            setEditingStatus('')
        }
    }

    // ✅ Handle blur to save status
    async function handleBlur(record: DTRRecord) {
        if (editingRecord) {
            await saveStatus(record)
        }
    }

    // ✅ Save status to database
    async function saveStatus(record: DTRRecord) {
        if (!editingRecord) return
        
        try {
            const userId = employees.find(emp => emp.employeeId === record.employeeId)?.id
            
            if (!userId) {
                setMessage('❌ Employee not found')
                setEditingRecord(null)
                setEditingStatus('')
                return
            }

            const response = await axios.put(`/api/dtr/update-status/${userId}`, {
                date: record.date,
                status: editingStatus
            })

            if (response.status === 200) {
                setMessage('✅ Status updated successfully')
                // Update local state
                const updatedRecords = dtrRecords.map(r => 
                    r.id === record.id ? { ...r, status: editingStatus } : r
                )
                setDtrRecords(updatedRecords)
                setEditingRecord(null)
                setEditingStatus('')
                
                // Clear message after 3 seconds
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (error: any) {
            console.error('Error updating status:', error)
            setMessage('❌ Error updating status')
            setEditingRecord(null)
            setEditingStatus('')
        }
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const month = e.target.value
        setSelectedMonth(month)
        fetchAllDTRRecords(month)
    }

    if (loading) {
        return (
            <div className='flex flex-col w-full bg-gray-200'>
                <ContentHeader/>
                <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading DTR records...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center px-5 pb-3 border-b border-gray-200'>
                    <p className='font-bold text-xl'>Manage DTR</p>
                    <div className='flex items-center gap-4'>
                        <input 
                            type='month' 
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                        <div className='flex items-center gap-2'>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                            >
                                <option value="all">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.employeeId}>
                                        {emp.name} ({emp.employeeId})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='flex items-center gap-2'>
                            <input
                                type='text'
                                placeholder='Search by name or ID...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm w-48'
                            />
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mx-5 mt-2 p-2 rounded text-sm ${
                        message.includes('✅') 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        {message}
                    </div>
                )}

                <div className='flex flex-col mb-3 mt-3'>
                    <div className="overflow-x-auto">
                        <table className='w-full text-gray-600 text-sm'>
                            <thead className='bg-gray-200 border-y-2 border-gray-300'>
                                <tr>
                                    <td className='pl-5 py-2 font-bold'>Employee ID</td>
                                    <td className='pl-5 py-2 font-bold'>Name</td>
                                    <td className='pl-5 py-2 font-bold'>Date</td>
                                    <td className='pl-5 py-2 font-bold'>AM In</td>
                                    <td className='pl-5 py-2 font-bold'>AM Out</td>
                                    <td className='pl-5 py-2 font-bold'>PM In</td>
                                    <td className='pl-5 py-2 font-bold'>PM Out</td>
                                    <td className='pl-5 py-2 font-bold'>Total Hours</td>
                                    <td className='pl-5 py-2 font-bold w-48'>Status</td>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className='text-center py-4 text-gray-500'>No DTR records found for this month</td>
                                    </tr>
                                ) : (
                                    currentRecords.map((record) => (
                                        <tr key={record.id} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                                            <td className='pl-5 py-2'>{record.employeeId}</td>
                                            <td className='pl-5 py-2'>{record.employeeName}</td>
                                            <td className='pl-5 py-2'>{record.date}</td>
                                            <td className='pl-5 py-2'>
                                                <div className='flex flex-col'>
                                                    <span>{record.timeInAM || '-'}</span>
                                                    {record.locationInAM && (
                                                        <span className='text-[10px] text-gray-400'>{record.locationInAM}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='pl-5 py-2'>
                                                <div className='flex flex-col'>
                                                    <span>{record.timeOutAM || '-'}</span>
                                                    {record.locationOutAM && (
                                                        <span className='text-[10px] text-gray-400'>{record.locationOutAM}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='pl-5 py-2'>
                                                <div className='flex flex-col'>
                                                    <span>{record.timeInPM || '-'}</span>
                                                    {record.locationInPM && (
                                                        <span className='text-[10px] text-gray-400'>{record.locationInPM}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='pl-5 py-2'>
                                                <div className='flex flex-col'>
                                                    <span>{record.timeOutPM || '-'}</span>
                                                    {record.locationOutPM && (
                                                        <span className='text-[10px] text-gray-400'>{record.locationOutPM}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='pl-5 py-2 font-medium'>{record.totalHours || '-'}</td>
                                            <td className='pl-5 py-2'>
                                                {editingRecord === record.id ? (
                                                    <input
                                                        ref={inputRef}
                                                        type="text"
                                                        value={editingStatus}
                                                        onChange={(e) => setEditingStatus(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, record)}
                                                        onBlur={() => handleBlur(record)}
                                                        className="border border-blue-500 rounded px-1 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Enter status..."
                                                    />
                                                ) : (
                                                    <span 
                                                        onDoubleClick={() => handleDoubleClick(record)}
                                                        className="cursor-pointer hover:text-blue-600 hover:underline"
                                                        title="Double-click to edit status"
                                                    >
                                                        {record.status || 'Click to add status'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className='flex justify-between items-center text-sm font-bold text-gray-600 px-5 mt-2'>
                        <p>Page {currentPage} of {totalPages} ({filteredRecords.length} records)</p>
                        <div className='flex gap-3'>
                            <button 
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Image src='/arrow-left.svg' width={14} height={14} alt='arrow-left'/>
                            </button>
                            <p>{currentPage}</p>
                            <button 
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Image src='/arrow-right.svg' width={14} height={14} alt='arrow-right'/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}