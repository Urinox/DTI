// components/Admin/Content/AccountManagement.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface Account {
    id: string
    email: string
    username: string
    role: string
    createdAt: string
    name: string
    division: string
    designation: string
    office: string
    employeeId: string
    disabled?: boolean
}

export default function AccountManagement() {
    const { data: session } = useSession()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [message, setMessage] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        username: '',
        role: 'cos',
        name: '',
        employeeId: ''
    })
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        username: '',
        role: '',
        division: '',
        designation: '',
        office: '',
        employeeId: ''
    })
    const [createError, setCreateError] = useState('')
    const [createSuccess, setCreateSuccess] = useState('')
    const [editError, setEditError] = useState('')
    const [editSuccess, setEditSuccess] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [rq1, setRq1] = useState(false)
    const [rq2, setRq2] = useState(false)
    const [rq3, setRq3] = useState(false)
    const itemsPerPage = 10

    // Municipalities of Marinduque
    const municipalities = [
        'Boac',
        'Buenavista', 
        'Gasan',
        'Mogpog',
        'Santa Cruz',
        'Torrijos'
    ]

    // ✅ Role mapping for display to database
    const roleMap: Record<string, string> = {
        'COS-JO': 'cos',
        'Division Head': 'division',
        'Provincial Director': 'sub',
        'Admin': 'admin'
    }

    // ✅ Reverse role mapping for database to display
    const roleDisplayMap: Record<string, string> = {
        'cos': 'COS-JO',
        'division': 'Division Head',
        'sub': 'Provincial Director',
        'admin': 'Admin'
    }

    // ✅ Check password requirements
    function validatePassword(password: string) {
        setCreateForm({...createForm, password: password})
        if(password.length >= 7) {
            setRq1(true)
        } else {
            setRq1(false)
        }
        if(password.match(/[A-Z]/) && password.match(/[a-z]/)){
            setRq2(true)
        } else {
            setRq2(false)
        }
        if(password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/)){
            setRq3(true)
        } else {
            setRq3(false)
        }
    }

    useEffect(() => {
        fetchAccounts()
    }, [session])

    useEffect(() => {
        filterAccounts()
    }, [accounts, searchTerm])

    async function fetchAccounts() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get('/api/admin/accounts')
            const data = response.data.data || []
            
            const formattedAccounts = data.map((user: any) => ({
                id: user.id || '',
                email: user.email || '',
                username: user.username || '',
                role: user.role || 'cos',
                createdAt: user.createdAt || '',
                name: user.profile?.name || user.username || '',
                division: user.profile?.division || '',
                designation: user.profile?.designation || '',
                office: user.profile?.office || '',
                employeeId: user.employeeId || '',
                disabled: user.disabled || false
            }))
            
            setAccounts(formattedAccounts)
        } catch (error) {
            console.error('Error fetching accounts:', error)
            setAccounts([])
        } finally {
            setLoading(false)
        }
    }

    function filterAccounts() {
        let filtered = [...accounts]
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(account => 
                account.name.toLowerCase().includes(term) ||
                account.username.toLowerCase().includes(term) ||
                account.email.toLowerCase().includes(term) ||
                account.employeeId.includes(term)
            )
        }
        
        setFilteredAccounts(filtered)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentAccounts = filteredAccounts.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError('')
        setCreateSuccess('')
        setIsCreating(true)

        if (!createForm.email || !createForm.password || !createForm.username) {
            setCreateError('Email, Password, and Username are required')
            setIsCreating(false)
            return
        }

        if (createForm.password.length < 7) {
            setCreateError('Password must be at least 7 characters')
            setIsCreating(false)
            return
        }

        // ✅ Check password requirements
        if (!rq1 || !rq2 || !rq3) {
            setCreateError('Please meet all password requirements')
            setIsCreating(false)
            return
        }

        try {
            // ✅ Convert display role to database role
            const dbRole = roleMap[createForm.role] || 'cos'

            const response = await axios.post('/api/admin/create-account', {
                email: createForm.email,
                password: createForm.password,
                username: createForm.username,
                role: dbRole,
                name: createForm.name || createForm.username,
                employeeId: createForm.employeeId || ''
            })

            if (response.status === 200 || response.status === 201) {
                setCreateSuccess('✅ Account created successfully!')
                setCreateForm({
                    email: '',
                    password: '',
                    username: '',
                    role: 'cos',
                    name: '',
                    employeeId: ''
                })
                setRq1(false)
                setRq2(false)
                setRq3(false)
                await fetchAccounts()
                setTimeout(() => {
                    setShowCreateModal(false)
                    setCreateSuccess('')
                }, 1500)
            }
        } catch (error: any) {
            console.error('Error creating account:', error)
            setCreateError(error.response?.data?.message || 'Error creating account. Please try again.')
        } finally {
            setIsCreating(false)
        }
    }

    const handleEditClick = (account: Account) => {
        setSelectedAccount(account)
        setEditForm({
            name: account.name || '',
            email: account.email || '',
            username: account.username || '',
            role: roleDisplayMap[account.role] || 'COS-JO',
            division: account.division || '',
            designation: account.designation || '',
            office: account.office || '',
            employeeId: account.employeeId || ''
        })
        setEditError('')
        setEditSuccess('')
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setEditError('')
        setEditSuccess('')
        setIsEditing(true)

        if (!editForm.name || !editForm.email || !editForm.username) {
            setEditError('Name, Email, and Username are required')
            setIsEditing(false)
            return
        }

        try {
            // ✅ Convert display role to database role
            const dbRole = roleMap[editForm.role] || 'cos'

            const payload: any = {
                name: editForm.name,
                email: editForm.email,
                username: editForm.username,
                role: dbRole,
                division: editForm.division,
                designation: editForm.designation,
                office: editForm.office,
                employeeId: editForm.employeeId
            }

            const response = await axios.put(`/api/admin/accounts/${selectedAccount?.id}`, payload)

            if (response.status === 200) {
                setEditSuccess('✅ Account updated successfully!')
                await fetchAccounts()
                setTimeout(() => {
                    setShowEditModal(false)
                    setEditSuccess('')
                }, 1500)
            }
        } catch (error: any) {
            console.error('Error updating account:', error)
            setEditError(error.response?.data?.message || 'Error updating account. Please try again.')
        } finally {
            setIsEditing(false)
        }
    }

    const handleDeleteClick = (account: Account) => {
        setSelectedAccount(account)
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedAccount) return
        
        setIsDeleting(true)
        try {
            const response = await axios.delete(`/api/admin/accounts/${selectedAccount.id}`)
            
            if (response.status === 200) {
                setMessage('✅ Account disabled successfully!')
                await fetchAccounts()
                setShowDeleteModal(false)
                setSelectedAccount(null)
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (error: any) {
            console.error('Error disabling account:', error)
            setMessage('❌ Error disabling account')
        } finally {
            setIsDeleting(false)
        }
    }

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            'admin': 'bg-red-100 text-red-700',
            'super_admin': 'bg-purple-100 text-purple-700',
            'division': 'bg-blue-100 text-blue-700',
            'sub': 'bg-green-100 text-green-700',
            'cos': 'bg-gray-100 text-gray-700'
        }
        return colors[role] || 'bg-gray-100 text-gray-700'
    }

    const formatRole = (role: string) => {
        return roleDisplayMap[role] || role
    }

    if (loading) {
        return (
            <div className='flex flex-col w-full'>
                <ContentHeader/>
                <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading accounts...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full'>
            <ContentHeader/>
            <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black shadow-lg'>
                <div className='flex justify-between items-center px-5 pb-3 border-b '>
                    <div className='flex items-center gap-4'>
                        <p className='font-bold text-xl'>Account Management</p>
                        <span className='text-sm text-gray-500'>({filteredAccounts.length} accounts)</span>
                    </div>
                    <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-2'>
                            <input
                                type='text'
                                placeholder='Search by name, username, email, or employee ID...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm w-64'
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className='bg-blue-600 text-white rounded-lg px-4 py-1.5 cursor-pointer font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2'
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Account
                        </button>
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
                                    <td className='pl-5 py-2 font-bold'>Username</td>
                                    <td className='pl-5 py-2 font-bold'>Email</td>
                                    <td className='pl-5 py-2 font-bold'>Role</td>
                                    <td className='pl-5 py-2 font-bold'>Division</td>
                                    <td className='pl-5 py-2 font-bold'>Designation</td>
                                    <td className='pl-5 py-2 font-bold w-24'>Action</td>
                                </tr>
                            </thead>
                            <tbody>
                                {currentAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className='text-center py-4 text-gray-500'>No accounts found</td>
                                    </tr>
                                ) : (
                                    currentAccounts.map((account) => (
                                        <tr key={account.id} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                                            <td className='pl-5 py-2'>{account.employeeId || '-'}</td>
                                            <td className='pl-5 py-2'>{account.name}</td>
                                            <td className='pl-5 py-2'>{account.username}</td>
                                            <td className='pl-5 py-2'>{account.email}</td>
                                            <td className='pl-5 py-2'>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadge(account.role)}`}>
                                                    {formatRole(account.role)}
                                                </span>
                                                {account.disabled && (
                                                    <span className='ml-1 text-xs text-red-500 font-semibold'>(Disabled)</span>
                                                )}
                                            </td>
                                            <td className='pl-5 py-2'>{account.division || '-'}</td>
                                            <td className='pl-5 py-2'>{account.designation || '-'}</td>
                                            <td className='pl-5 py-2'>
                                                <div className='flex items-center gap-2'>
                                                    <svg 
                                                        onClick={() => handleEditClick(account)}
                                                        className='cursor-pointer hover:opacity-70 text-blue-600' 
                                                        width="16" 
                                                        height="16" 
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
                                                    {account.role !== 'admin' && account.role !== 'super_admin' && (
                                                        <svg 
                                                            onClick={() => handleDeleteClick(account)}
                                                            className='cursor-pointer hover:opacity-70 text-red-600' 
                                                            width="16" 
                                                            height="16" 
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
                                                    )}
                                                </div>
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
                        <p>Page {currentPage} of {totalPages} ({filteredAccounts.length} accounts)</p>
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

            {/* Create Account Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg border border-black py-6 w-[450px] shadow-2xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center px-6 border-b border-gray-300 pb-4'>
                            <p className='text-xl font-bold'>Create Account</p>
                            <button 
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setCreateError('')
                                    setCreateSuccess('')
                                    setCreateForm({
                                        email: '',
                                        password: '',
                                        username: '',
                                        role: 'cos',
                                        name: '',
                                        employeeId: ''
                                    })
                                    setRq1(false)
                                    setRq2(false)
                                    setRq3(false)
                                }}
                                className='text-gray-500 hover:text-gray-700 text-xl'
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateAccount} className='px-6 py-4 space-y-4'>
                            {createError && (
                                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                                    ❌ {createError}
                                </div>
                            )}
                            {createSuccess && (
                                <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm'>
                                    {createSuccess}
                                </div>
                            )}
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Employee ID</label>
                                <input
                                    type='text'
                                    value={createForm.employeeId}
                                    onChange={(e) => setCreateForm({...createForm, employeeId: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter employee ID (e.g., 00001)'
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Full Name</label>
                                <input
                                    type='text'
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter full name'
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Username *</label>
                                <input
                                    type='text'
                                    value={createForm.username}
                                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter username'
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Email *</label>
                                <input
                                    type='email'
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter email address'
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Password *</label>
                                <div className='flex items-center border border-gray-300 rounded-lg px-4 py-2 mt-1 focus-within:ring-2 focus-within:ring-blue-500'>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={createForm.password}
                                        onChange={(e) => validatePassword(e.target.value)}
                                        className='w-full outline-0 text-sm'
                                        placeholder='Enter password (min 7 characters)'
                                        required
                                        minLength={7}
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='text-gray-500 hover:text-gray-700 ml-2'
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {showPassword ? (
                                                <>
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </>
                                            )}
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className='flex flex-col gap-1 mt-1'>
                                <div className='flex items-center gap-2'>
                                    <div className={`w-3 h-3 transition duration-300 rounded-full ${rq1 ? 'bg-green-400' : createForm.password ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                                    <p className={`text-xs transition duration-300 ${rq1 ? 'text-green-600' : createForm.password ? 'text-red-600' : 'text-gray-500'}`}>
                                        Minimum of 7 characters
                                    </p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className={`w-3 h-3 transition duration-300 rounded-full ${rq2 ? 'bg-green-400' : createForm.password ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                                    <p className={`text-xs transition duration-300 ${rq2 ? 'text-green-600' : createForm.password ? 'text-red-600' : 'text-gray-500'}`}>
                                        Must contain uppercase and lowercase
                                    </p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className={`w-3 h-3 transition duration-300 rounded-full ${rq3 ? 'bg-green-400' : createForm.password ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                                    <p className={`text-xs transition duration-300 ${rq3 ? 'text-green-600' : createForm.password ? 'text-red-600' : 'text-gray-500'}`}>
                                        Must contain special character (e.g, -!@_#&)
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Role *</label>
                                <select
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                >
                                    <option value="COS-JO">COS-JO</option>
                                    <option value="Division Head">Division Head</option>
                                    <option value="Provincial Director">Provincial Director</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            
                            <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        setCreateError('')
                                        setCreateSuccess('')
                                        setCreateForm({
                                            email: '',
                                            password: '',
                                            username: '',
                                            role: 'cos',
                                            name: '',
                                            employeeId: ''
                                        })
                                        setRq1(false)
                                        setRq2(false)
                                        setRq3(false)
                                    }}
                                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isCreating}
                                    className='bg-blue-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50'
                                >
                                    {isCreating ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Account Modal */}
            {showEditModal && selectedAccount && (
                <div className='fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg border border-black py-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl'>
                        <div className='flex justify-between items-center px-6 border-b border-gray-300 pb-4'>
                            <p className='text-xl font-bold'>Edit Account</p>
                            <button 
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditError('')
                                    setEditSuccess('')
                                }}
                                className='text-gray-500 hover:text-gray-700 text-xl'
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className='px-6 py-4 space-y-4'>
                            <div className='bg-gray-50 p-3 rounded-lg mb-2'>
                                <p className='text-sm text-gray-600'>
                                    <span className='font-semibold'>Editing:</span> {selectedAccount.name}
                                </p>
                            </div>

                            {editError && (
                                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                                    ❌ {editError}
                                </div>
                            )}
                            {editSuccess && (
                                <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm'>
                                    {editSuccess}
                                </div>
                            )}
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Employee ID</label>
                                <input
                                    type='text'
                                    value={editForm.employeeId}
                                    onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter employee ID'
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
                                <label className='font-bold text-sm text-gray-700'>Role *</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                >
                                    <option value="COS-JO">COS-JO</option>
                                    <option value="Division Head">Division Head</option>
                                    <option value="Provincial Director">Provincial Director</option>
                                    <option value="Admin">Admin</option>
                                </select>
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
                                <label className='font-bold text-sm text-gray-700'>Designation</label>
                                <input
                                    type='text'
                                    value={editForm.designation}
                                    onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter designation'
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
                            
                            <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditError('')
                                        setEditSuccess('')
                                    }}
                                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isEditing}
                                    className='bg-blue-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50'
                                >
                                    {isEditing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedAccount && (
                <div className='fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg border border-black py-6 w-[400px] shadow-2xl'>
                        <div className='flex pl-6 items-center w-full border-b border-gray-300 pb-4'>
                            <p className='text-xl font-bold'>Disable Account</p>
                        </div>
                        
                        <div className='px-6 py-4'>
                            <p className='text-gray-700'>
                                Are you sure you want to disable the account for <strong>{selectedAccount.name}</strong>?
                                The user will not be able to log in, but their data will be preserved.
                                This action can be undone.
                            </p>
                            
                            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedAccount(null)
                                    }}
                                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className='bg-red-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50'
                                >
                                    {isDeleting ? 'Disabling...' : 'Disable Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}