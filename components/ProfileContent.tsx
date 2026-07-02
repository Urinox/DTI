// components/ProfileContent.tsx
import ContentHeader from "@/components/ContentHeader"
import EditProfilePopup from "@/components/EditProfilePopup"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"

interface ProfileData {
    name: string
    email: string
    division: string
    designation: string
    office: string
    username: string
    employeeId: string  // ✅ Added employeeId
}

export default function ProfileContent() {
    const { data: session } = useSession()
    const [show, setShow] = useState(false)
    const [profileImage, setProfileImage] = useState<string>('/profile.svg')
    const [isUploading, setIsUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [profileData, setProfileData] = useState<ProfileData>({
        name: '',
        email: '',
        division: '',
        designation: '',
        office: '',
        username: '',
        employeeId: ''  // ✅ Added employeeId
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isProvincialDirector = session?.user?.role === 'provincial-director' || session?.user?.role === 'sub'

    // ✅ Fetch profile directly from database
    const fetchProfile = async () => {
        if (!session?.user?.id) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await axios.get(`/api/profile/${session.user.id}`)
            console.log('📋 Profile data from DB:', response.data)

            if (response.data?.data) {
                const userData = response.data.data
                const profile = userData.profile || {}

                setProfileData({
                    name: profile.name || userData.username || '',
                    email: profile.email || userData.email || '',
                    division: profile.division || '',
                    designation: profile.designation || '',
                    office: profile.office || '',
                    username: userData.username || '',
                    employeeId: userData.employeeId || ''  // ✅ Get employeeId from user data
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    // ✅ Fetch profile on mount and when session changes
    useEffect(() => {
        if (session?.user?.id) {
            fetchProfile()
        }
    }, [session])

    useEffect(() => {
        const savedImage = localStorage.getItem(`profile_image_${session?.user?.id}`)
        if (savedImage) {
            setProfileImage(savedImage)
        }
    }, [session?.user?.id])

    const handleImageClick = () => {
        fileInputRef.current?.click()
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB')
            return
        }

        setIsUploading(true)

        try {
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64String = reader.result as string
                localStorage.setItem(`profile_image_${session?.user?.id}`, base64String)
                setProfileImage(base64String)

                try {
                    await axios.post(`/api/profile/upload-image/${session?.user?.id}`, {
                        image: base64String
                    })
                } catch (error) {
                    console.error('Error saving image to database:', error)
                }

                setIsUploading(false)
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error uploading image. Please try again.')
            setIsUploading(false)
        }
    }

    const removeImage = async () => {
        if (confirm('Remove profile picture?')) {
            setProfileImage('/profile.svg')
            localStorage.removeItem(`profile_image_${session?.user?.id}`)
            
            try {
                await axios.delete(`/api/profile/upload-image/${session?.user?.id}`)
            } catch (error) {
                console.error('Error removing image:', error)
            }
        }
    }

    const handleProfileSaved = async () => {
        console.log('🔄 Profile saved, refreshing data...')
        await fetchProfile()
        setShow(false)
    }

    if (loading) {
        return (
            <div className='flex flex-col w-full'>
                <ContentHeader />
                <div className='flex flex-col bg-white border-[1] mx-70 border-black rounded-xl my-10 p-5 shadow-lg'>
                    <div className='flex justify-center items-center py-10'>
                        <p className='text-gray-500'>Loading profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full'>
            <ContentHeader />
            <div className='flex flex-col bg-white border-[1] mx-70 border-black rounded-xl my-10 p-5 shadow-lg'>
                <div className='flex items-center gap-5'>
                    <div className='relative group'>
                        <div 
                            className={`relative w-[90px] h-[90px] rounded-full overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-blue-500 transition-colors ${
                                isUploading ? 'opacity-50' : ''
                            }`}
                            onClick={handleImageClick}
                        >
                            <Image 
                                src={profileImage} 
                                width={90} 
                                height={90} 
                                alt='Profile'
                                className='object-cover w-full h-full'
                            />
                            <div className='absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                <span className='text-white text-[10px] font-medium text-center px-1'>
                                    Click to change
                                </span>
                            </div>
                            {isUploading && (
                                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                                    <div className='animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent'></div>
                                </div>
                            )}
                        </div>
                        {profileImage !== '/profile.svg' && (
                            <button
                                onClick={removeImage}
                                className='absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors'
                            >
                                ×
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                    
                    <div>
                        <p className='text-xl font-bold'>{profileData.name || 'No Name'}</p>
                        <p className='text-gray-600'>Employee ID: #{profileData.employeeId || 'Not assigned'}</p>
                        {profileData.username && <p className='text-gray-800 text-sm'>@{profileData.username}</p>}
                        <button onClick={() => setShow(!show)} className='flex items-center gap-2 bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mt-1'>
                            <Image src='/user_edit.svg' width={16} height={16} alt='edit'/>
                            <p>Edit</p>
                        </button>
                    </div>
                </div>
                <div className='grid grid-cols-2 gap-5 mt-7 mb-2 ml-5'>
                    <div>
                        <p className='font-bold'>Email</p>
                        <p className='text-gray-600'>{profileData.email || 'Not set'}</p>
                    </div>
                    {!isProvincialDirector && (
                        <div>
                            <p className='font-bold'>Division</p>
                            <p className='text-gray-600'>{profileData.division || 'Not specified'}</p>
                        </div>
                    )}
                    <div>
                        <p className='font-bold'>Designation</p>
                        <p className='text-gray-600'>{profileData.designation || 'Not set'}</p>
                    </div>
                    {!isProvincialDirector && (
                        <div>
                            <p className='font-bold'>Office</p>
                            <p className='text-gray-600'>{profileData.office || 'Not specified'}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${show ? 'flex' : 'hidden'}`}>
                <EditProfilePopup 
                    showPopup={() => setShow(false)} 
                    profileData={profileData}
                    id={session?.user?.id || ''}
                    getProfile={fetchProfile}
                    onProfileSaved={handleProfileSaved}
                />
            </div>
        </div>
    )
}