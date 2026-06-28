// app/home/page.tsx - Profile Creation Page
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import axios from "axios"
import { useSession } from "next-auth/react"
import Loading from "@/components/Loading"
import { useRouter } from "next/navigation"
import EditProfilePopup from "@/components/EditProfilePopup"

export default function HomePage() {
    const [showPopup, setShowPopup] = useState(false)
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        division: '',
        designation: '',
        office: ''
    })
    const [loading, setLoading] = useState(true)
    const [hasProfile, setHasProfile] = useState(false)
    const [isProfileRequired, setIsProfileRequired] = useState(false)

    const { data: session, status } = useSession()
    const router = useRouter()

    // Map database roles to folder names
    function getDashboardPath(role: string): string {
        const roleMap: { [key: string]: string } = {
            'admin': 'admin',
            'provincial-director': 'provincial-director',
            'division-head': 'division-head',
            'cos': 'cos-jo',
            'cos-jo': 'cos-jo',
            'sub': 'provincial-director'
        }
        return roleMap[role] || 'cos-jo'
    }

const getProfile = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
        const response = await axios.get(`/api/profile/${session.user.id}`)
        console.log('Profile response:', response.data)
        
        if (response.data?.data) {
            const userData = response.data.data
            const profile = userData.profile || {}
            
            const newProfileData = {
                name: profile.name || userData.username || '',
                email: userData.email || '',
                division: profile.division || '',
                designation: profile.designation || '',
                office: profile.office || ''
            }
            
            setProfileData(newProfileData)
            setUsername(profile.name || userData.username || 'User')
            
            // ✅ Update the profile data in the parent state
            // The ProfileContent will receive this updated data via props
        }
    } catch (error) {
        console.error('Error fetching profile:', error)
    }
}, [session])

    function togglePopup() {
        if (isProfileRequired) {
            if (hasProfile) {
                setShowPopup(false)
            } else {
                alert('Please complete your profile to continue.')
                return
            }
        } else {
            setShowPopup(!showPopup)
        }
    }

    function handleProfileSaved() {
        setHasProfile(true)
        setIsProfileRequired(false)
        setShowPopup(false)
        getProfile()
    }

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/')
            return
        }

        if (session?.user?.id) {
            getProfile()
        } else {
            setLoading(false)
        }
    }, [session, status, router, getProfile])

    if (status === 'loading' || loading) {
        return <Loading />
    }

    return (
        <main className='flex items-center justify-center min-h-screen bg-[rgba(3,7,61,1)] p-4'>
            <div className='bg-white flex items-center flex-col gap-8 py-5 px-10 rounded-lg w-96 max-w-full'>
                <div className='flex gap-5'>
                    <Image src={'/dti_logo.png'} width={70} height={70} alt='DTI Logo'/>
                    <Image src={'/bagong_pilipinas_logo.png'} width={70} height={70} alt='Bagong Pilipinas Logo'/>
                </div>
                
                {hasProfile ? (
                    <>
                        <p className='font-bold text-gray-800 text-xl'>Welcome, {profileData.name || session?.user?.username}!</p>
                        <div className="w-full space-y-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{profileData.email}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Division</p>
                                <p className="font-medium">{profileData.division || 'Not specified'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Office</p>
                                <p className="font-medium">{profileData.office}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Designation</p>
                                <p className="font-medium">{profileData.designation}</p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        const dashboardPath = getDashboardPath(session?.user?.role || 'cos-jo')
                                        router.push(`/home/${dashboardPath}`)
                                    }}
                                    className="flex-1 bg-red-800 text-white py-2 rounded-full font-semibold hover:bg-red-700 transition-colors"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={() => setShowPopup(true)}
                                    className="px-4 bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-2">
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg text-sm text-center w-full">
                                ⚠️ Profile Required
                            </div>
                            <p className='font-bold text-gray-800 text-xl'>Complete Your Profile</p>
                            <p className='text-sm text-gray-500 text-center'>
                                Welcome {session?.user?.username}! You must complete your profile before continuing.
                            </p>
                        </div>
                        
                        <button
                            onClick={() => setShowPopup(true)}
                            className="w-[80%] bg-red-800 text-white py-2 rounded-full font-semibold hover:bg-red-700 transition-colors"
                        >
                            Create Profile Now
                        </button>
                    </>
                )}
            </div>

            {/* Profile Popup */}
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative">
                        {!isProfileRequired && (
                            <button
                                onClick={togglePopup}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {isProfileRequired && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                Required
                            </div>
                        )}
                        <EditProfilePopup
                            showPopup={() => {
                                if (isProfileRequired) {
                                    alert('Please complete your profile to continue.')
                                    return
                                }
                                togglePopup()
                            }}
                            profileData={profileData}
                            id={session?.user?.id || ''}
                            getProfile={getProfile}
                            onProfileSaved={handleProfileSaved}
                        />
                    </div>
                </div>
            )}
        </main>
    )
}