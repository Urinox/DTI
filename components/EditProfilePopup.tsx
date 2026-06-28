// components/EditProfilePopup.tsx
import { useState, useEffect } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"

interface ProfileData {
    name: string
    email: string
    division: string
    designation: string
    office: string
    username: string
}

interface EditProfilePopupProps {
    showPopup: () => void
    profileData: ProfileData
    id: string
    getProfile: () => void
    onProfileSaved?: () => void
}

export default function EditProfilePopup({ 
    showPopup, 
    profileData, 
    id, 
    getProfile,
    onProfileSaved 
}: EditProfilePopupProps) {
    const { data: session } = useSession()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [division, setDivision] = useState('')
    const [designation, setDesignation] = useState('')
    const [office, setOffice] = useState('')
    const [username, setUsername] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [isNewProfile, setIsNewProfile] = useState(false)
    
    // Check user role
    const isCOS = session?.user?.role === 'cos-jo' || session?.user?.role === 'cos'
    const isDivision = session?.user?.role === 'division-head' || session?.user?.role === 'division'
    const isProvincialDirector = session?.user?.role === 'provincial-director' || session?.user?.role === 'sub'
    const showOfficeDropdown = isCOS || isDivision
    const showDivisionField = isCOS || isDivision
    
    // Check if user already has an office set (for both COS-JO and Division Head)
    const isCOSJO = session?.user?.role === 'cos-jo'
    const isDivisionHead = session?.user?.role === 'division-head' || session?.user?.role === 'division'
    const isOfficeLocked = (isCOSJO || isDivisionHead) && profileData?.office && profileData.office !== ''

    // Municipalities of Marinduque
    const municipalities = [
        'Boac',
        'Buenavista', 
        'Gasan',
        'Mogpog',
        'Santa Cruz',
        'Torrijos'
    ]

    function getProfileData() {
        if (profileData && profileData.name) {
            setName(profileData.name || '')
            setEmail(profileData.email || '')
            setDivision(profileData.division || '')
            setDesignation(profileData.designation || '')
            setOffice(profileData.office || '')
            setUsername(profileData.username || '')
            setIsNewProfile(false)
        } else {
            setIsNewProfile(true)
            setName('')
            setEmail('')
            setDivision('')
            setDesignation('')
            setOffice('')
            setUsername('')
        }
    }

    async function handleSubmit(e: any) {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        
        if (isOfficeLocked && office !== profileData.office) {
            setError('You cannot change your office after it has been set.')
            setIsLoading(false)
            return
        }
        
        if (!name || !email || !designation) {
            setError('Please fill in all required fields')
            setIsLoading(false)
            return
        }

        if ((isCOS || isDivision) && !office) {
            setError('Office is required')
            setIsLoading(false)
            return
        }

        try {
            const userId = session?.user?.id
            
            if (!userId) {
                setError('User not authenticated')
                setIsLoading(false)
                return
            }
            
            const profileDataToSend: any = {
                name: name, 
                email: email, 
                designation: designation
            }
            
            // Only include username if it has a value
            if (username) {
                profileDataToSend.username = username
            }
            
            if (showDivisionField) {
                profileDataToSend.division = division || ''
            } else {
                profileDataToSend.division = ''
            }
            
            if (!isProvincialDirector) {
                profileDataToSend.office = office || ''
            } else {
                profileDataToSend.office = ''
            }
            
            console.log('Saving profile for user:', userId)
            console.log('Profile data:', profileDataToSend)
            
            const response = await axios.post(`/api/profile/${userId}`, profileDataToSend)
            
            console.log('Profile saved:', response.data)
            
            if (getProfile) {
                await getProfile()
            }
            
            if (onProfileSaved) {
                await onProfileSaved()
            }
            
            showPopup()
            
        } catch (err: any) {
            console.error('Error saving profile:', err.response?.data || err.message)
            setError(err.response?.data?.message || 'Error saving profile. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getProfileData()
    }, [profileData])

    return (
        <div className='flex flex-col bg-white gap-2 rounded-lg border border-black py-5 w-[35%] min-w-[400px] max-w-[500px] shadow-2xl'>
            <div className='flex pl-5 items-center w-full border-b border-gray-300 pb-5'>
                <p className='text-xl font-bold'>
                    {isNewProfile ? 'Create Profile' : 'Edit Profile'}
                </p>
            </div>
            
            {error && (
                <div className="mx-5 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                    ❌ {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex gap-2 flex-col'>
                    <label className='font-bold text-gray-700'>Username</label>
                    <input
                        type='text'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500'
                        placeholder="Enter your username (optional)"
                    />
                </div>
                
                <div className='flex gap-2 flex-col'>
                    <label className='font-bold text-gray-700'>Full Name *</label>
                    <input
                        required
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500'
                        placeholder="Enter your full name"
                    />
                </div>
                
                <div className='flex gap-2 flex-col'>
                    <label className='font-bold text-gray-700'>Email *</label>
                    <input
                        required
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500'
                        placeholder="Enter your email"
                    />
                </div>
                
                {showDivisionField && (
                    <div className='flex gap-2 flex-col'>
                        <label className='font-bold text-gray-700'>Division</label>
                        <input
                            type='text'
                            value={division}
                            onChange={(e) => setDivision(e.target.value)}
                            className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500'
                            placeholder="Enter your division"
                        />
                    </div>
                )}
                
                {!isProvincialDirector && (
                    <div className='flex gap-2 flex-col'>
                        <label className='font-bold text-gray-700'>Office *</label>
                        {isOfficeLocked ? (
                            <input
                                type='text'
                                value={office}
                                disabled
                                className='border py-2 border-gray-300 text-gray-500 bg-gray-100 rounded-lg px-5 outline-0 cursor-not-allowed'
                            />
                        ) : showOfficeDropdown ? (
                            <select
                                required
                                value={office}
                                onChange={(e) => setOffice(e.target.value)}
                                className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500 appearance-none bg-white'
                            >
                                <option value="">Select your office</option>
                                {municipalities.map((municipality) => (
                                    <option key={municipality} value={municipality}>
                                        {municipality}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                required
                                type='text'
                                value={office}
                                onChange={(e) => setOffice(e.target.value)}
                                className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500'
                                placeholder="Enter your office"
                            />
                        )}
                        {isOfficeLocked && (
                            <p className='text-xs text-gray-500 mt-1'>
                                Office cannot be changed after it has been set.
                            </p>
                        )}
                    </div>
                )}
                
                <div className='flex gap-2 flex-col'>
                    <label className='font-bold text-gray-700'>Designation *</label>
                    <input
                        required
                        type='text'
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className='border py-2 border-gray-300 text-gray-700 rounded-lg px-5 outline-0 focus:ring-2 focus:ring-blue-500'
                        placeholder="Enter your designation"
                    />
                </div>
                
                <div className='flex items-center w-full justify-end mt-2 gap-3'>
                    <button
                        type="button"
                        onClick={showPopup}
                        className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className='bg-red-800 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50'
                    >
                        {isLoading ? 'Saving...' : isNewProfile ? 'Create Profile' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}