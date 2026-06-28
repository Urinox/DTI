// components/Admin/Content/DTRManagerContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

export default function DTRManagerContent() {
    const { data: session } = useSession()
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [editForm, setEditForm] = useState({
        employeeId: '',
        username: '',
        name: '',
        email: '',
        division: '',
        office: '',
        designation: ''
    })
    const [editError, setEditError] = useState('')
    const [editSuccess, setEditSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const itemsPerPage = 5

    // Municipalities of Marinduque
    const municipalities = [
        'Boac',
        'Buenavista', 
        'Gasan',
        'Mogpog',
        'Santa Cruz',
        'Torrijos'
    ]

    useEffect(() => {
        fetchEmployees()
    }, [session])

    async function fetchEmployees() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get('/api/admin/employees')
            const data = response.data.data || []
            
            const formattedEmployees = data.map((user: any, index: number) => {
                let employeeId = user.employeeId || user.id
                if (employeeId.length > 5) {
                    const num = (index + 1).toString().padStart(5, '0')
                    employeeId = num
                } else if (employeeId.length < 5) {
                    employeeId = employeeId.padStart(5, '0')
                }
                
                return {
                    id: user.id || '',
                    employeeId: employeeId,
                    username: user.username || '',
                    name: user.profile?.name || user.username || 'Unknown',
                    email: user.email || '',
                    designation: user.profile?.designation || user.designation || 'N/A',
                    division: user.profile?.division || '',
                    office: user.profile?.office || ''
                }
            })
            
            setEmployees(formattedEmployees)
        } catch (error) {
            console.error('Error fetching employees:', error)
            setEmployees([])
        } finally {
            setLoading(false)
        }
    }

    const totalPages = Math.ceil(employees.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentEmployees = employees.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleEditClick = (employee: any) => {
        setSelectedEmployee(employee)
        setEditForm({
            employeeId: employee.employeeId || '',
            username: employee.username || '',
            name: employee.name || '',
            email: employee.email || '',
            division: employee.division || '',
            office: employee.office || '',
            designation: employee.designation || ''
        })
        setEditError('')
        setEditSuccess('')
        setShowEditModal(true)
    }

    const handleDeleteClick = (employee: any) => {
        setSelectedEmployee(employee)
        setShowDeleteModal(true)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setEditError('')
        setEditSuccess('')
        setIsLoading(true)

        // Validation
        if (!editForm.employeeId || !editForm.username || !editForm.name || !editForm.email || !editForm.designation) {
            setEditError('Employee ID, Username, Name, Email, and Designation are required')
            setIsLoading(false)
            return
        }

        // Validate Employee ID is exactly 5 digits
        if (!/^\d{5}$/.test(editForm.employeeId)) {
            setEditError('Employee ID must be exactly 5 digits (e.g., 00001)')
            setIsLoading(false)
            return
        }

        try {
            const payload: any = {
                employeeId: editForm.employeeId,
                username: editForm.username,
                name: editForm.name,
                email: editForm.email,
                division: editForm.division || '',
                office: editForm.office || '',
                designation: editForm.designation || ''
            }

            const response = await axios.put(`/api/admin/employees/${selectedEmployee.id}`, payload)
            
            if (response.status === 200) {
                setEditSuccess('Employee updated successfully!')
                setTimeout(() => {
                    setShowEditModal(false)
                    fetchEmployees()
                }, 1500)
            }
        } catch (error: any) {
            console.error('Error updating employee:', error)
            setEditError(error.response?.data?.message || 'Error updating employee. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setIsLoading(true)
        try {
            const response = await axios.delete(`/api/admin/employees/${selectedEmployee.id}`)
            
            if (response.status === 200) {
                setShowDeleteModal(false)
                fetchEmployees()
            }
        } catch (error: any) {
            console.error('Error deleting employee:', error)
            alert(error.response?.data?.message || 'Error deleting employee. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (loading) {
        return (
            <div className='flex flex-col w-full bg-gray-200'>
                <ContentHeader/>
                <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                <p className='font-bold text-xl ml-5'>Employee Accounts</p>
                <div className='flex flex-col mb-3 mt-5 border-b-2 border-gray-300'>
                    <table className='w-full text-gray-600 text-s'>
                        <thead className='bg-gray-200 border-y-2 border-gray-300'>
                            <tr>
                                <td className='pl-10 py-1 font-bold w-40'>Employee ID</td>
                                <td className='pl-10 py-1 font-bold'>Username</td>
                                <td className='pl-10 py-1 font-bold'>Name</td>
                                <td className='pl-10 py-1 font-bold'>Email</td>
                                <td className='pl-10 py-1 font-bold w-40'>Designation</td>
                                <td className='pl-10 py-1 font-bold w-40'>Action</td>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='text-center py-4 text-gray-500'>No employees found</td>
                                </tr>
                            ) : (
                                currentEmployees.map((employee) => (
                                    <tr key={employee.id} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                                        <td className='pl-10 py-1'>{employee.employeeId}</td>
                                        <td className='pl-10 py-1'>{employee.username}</td>
                                        <td className='pl-10 py-1'>{employee.name}</td>
                                        <td className='pl-10 py-1'>{employee.email}</td>
                                        <td className='pl-10 py-1'>{employee.designation}</td>
                                        <td className='pl-10 py-1'>
                                            <div className='flex items-center gap-2'>
                                                <svg 
                                                    onClick={() => handleEditClick(employee)}
                                                    className='cursor-pointer hover:opacity-70 text-blue-600' 
                                                    width="14" 
                                                    height="14" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                                <svg 
                                                    onClick={() => handleDeleteClick(employee)}
                                                    className='cursor-pointer hover:opacity-70 text-red-600' 
                                                    width="14" 
                                                    height="14" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M3 6h18"/>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                </svg>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className='flex justify-between items-center text-sm font-bold text-gray-600 px-8'>
                        <p>Page {currentPage} of {totalPages}</p>
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

            {/* Edit Modal */}
            {showEditModal && (
                <div className='fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg border border-black py-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl'>
                        <div className='flex pl-6 items-center w-full border-b border-gray-300 pb-4'>
                            <p className='text-xl font-bold'>Edit Employee</p>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className='px-6 py-4 space-y-4'>
                            {editError && (
                                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                                    ❌ {editError}
                                </div>
                            )}
                            {editSuccess && (
                                <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm'>
                                    ✅ {editSuccess}
                                </div>
                            )}
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Employee ID * (5 digits)</label>
                                <input
                                    type='text'
                                    value={editForm.employeeId}
                                    onChange={(e) => setEditForm({...editForm, employeeId: e.target.value.replace(/\D/g, '').slice(0, 5)})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='e.g., 00001'
                                    required
                                    maxLength={5}
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Username *</label>
                                <input
                                    type='text'
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Full Name *</label>
                                <input
                                    type='text'
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Email *</label>
                                <input
                                    type='email'
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Division</label>
                                <input
                                    type='text'
                                    value={editForm.division}
                                    onChange={(e) => setEditForm({...editForm, division: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter division'
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Office</label>
                                <select
                                    value={editForm.office}
                                    onChange={(e) => setEditForm({...editForm, office: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white'
                                >
                                    <option value="">Select office</option>
                                    {municipalities.map((municipality) => (
                                        <option key={municipality} value={municipality}>
                                            {municipality}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Designation *</label>
                                <input
                                    type='text'
                                    value={editForm.designation}
                                    onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    required
                                />
                            </div>
                            
                            <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                                <button
                                    type='button'
                                    onClick={() => setShowEditModal(false)}
                                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isLoading}
                                    className='bg-blue-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50'
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className='fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg border border-black py-6 w-[400px] shadow-2xl'>
                        <div className='flex pl-6 items-center w-full border-b border-gray-300 pb-4'>
                            <p className='text-xl font-bold'>Delete Employee</p>
                        </div>
                        
                        <div className='px-6 py-4'>
                            <p className='text-gray-700'>
                                Are you sure you want to delete <strong>{selectedEmployee?.name}</strong>?
                                This action cannot be undone.
                            </p>
                            
                            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
                                <button
                                    type='button'
                                    onClick={() => setShowDeleteModal(false)}
                                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    onClick={handleDeleteConfirm}
                                    disabled={isLoading}
                                    className='bg-red-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50'
                                >
                                    {isLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}