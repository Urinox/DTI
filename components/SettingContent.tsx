// components/SettingContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState } from "react"
import axios from "axios"
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function SettingContent({username, id} : {username: string, id: string}) {
    const [isCurrentFocused, setIsCurrentFocused] = useState(false)
    const [isNewFocused, setIsNewFocused] = useState(false)
    const [isConfirmFocused, setIsConfirmFocused] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [rq1, setRq1] = useState(false)
    const [rq2, setRq2] = useState(false)
    const [rq3, setRq3] = useState(false)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    function validateNewPassword(password: string) {
        setNewPassword(password)
        if(password.length >= 7) {
            setRq1(true)
        }else{
            setRq1(false)
        }
        if(password.match(/[A-Z]/) && password.match(/[a-z]/)){
            setRq2(true)
        }else{
            setRq2(false)
        }
        if(password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/)){
            setRq3(true)
        }else{
            setRq3(false)
        }
        if (rq1 && rq2 && rq3) return true
        return false
    }

    function checkPasswordMatch() {
        if(newPassword === confirmPassword) return true
        return false
    }

    async function handleSubmit(e:any) {
        e.preventDefault()
        setMessage('')
        setIsLoading(true)

        // Validate password requirements
        if (!rq1 || !rq2 || !rq3) {
            setMessage('Please meet all password requirements')
            setIsLoading(false)
            return
        }

        // Check if passwords match
        if (!checkPasswordMatch()) {
            setMessage('Passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            // Get the current user from Firebase Auth
            const user = auth.currentUser
            
            if (!user || !user.email) {
                setMessage('User not authenticated. Please login again.')
                setIsLoading(false)
                return
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            )

            try {
                await reauthenticateWithCredential(user, credential)
                
                // Update password in Firebase Auth
                await updatePassword(user, newPassword)
                
                setMessage('✅ Password changed successfully!')
                
                // Clear form
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setRq1(false)
                setRq2(false)
                setRq3(false)
                
            } catch (authError: any) {
                if (authError.code === 'auth/wrong-password') {
                    setMessage('❌ Current password is incorrect')
                } else if (authError.code === 'auth/too-many-requests') {
                    setMessage('❌ Too many attempts. Please try again later.')
                } else {
                    setMessage(`❌ Error: ${authError.message}`)
                }
            }

        } catch (err: any) {
            console.error('Password change error:', err)
            setMessage('❌ An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return(
        <div className='flex flex-col w-full'>
            <ContentHeader username={username}/>
            <div className='flex flex-col bg-white border-[1] my-5 rounded-xl py-5 mx-70 gap-5 shadow-lg'>
                <div className='w-full border-b-[1] border-gray-600 pl-5 pb-5'>
                    <p className='text-xl font-bold'>Change Password</p>
                </div>
                
                {message && (
                    <div className={`mx-10 p-3 rounded-lg text-sm ${
                        message.includes('✅') 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        {message}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className='flex flex-col mx-10 gap-3'>
                    <div className='flex flex-col gap-1'>
                        <label className={`${isCurrentFocused || currentPassword ? 'text-blue-700' : 'text-gray-700'}`}>Current Password</label>
                        <div className={`flex items-center border-2 rounded-lg px-5 py-2 justify-between gap-2
                        ${isCurrentFocused || currentPassword ? 'border-blue-500' : 'border-gray-400'}`}>
                            <input
                                required
                                id='currentPassword'
                                onFocus={() => setIsCurrentFocused(true)}
                                onBlur={() => setIsCurrentFocused(false)}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className='outline-0 flex-1 text-gray-700' type={showCurrentPassword ? 'text' : 'password'}
                                disabled={isLoading}
                            />
                            <Image
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className='cursor-pointer' src={showCurrentPassword ? '/eye.svg' : '/eye_close.svg'} width={18} height={18} alt='eye'/>
                        </div>
                    </div>
                    
                    <div className='flex flex-col gap-1'>
                        <label className={`${isNewFocused || newPassword ? 'text-blue-700' : 'text-gray-700'}`}>New Password</label>
                        <div className={`flex items-center border-2 rounded-lg px-5 py-2 justify-between gap-2
                        ${isNewFocused || newPassword ? 'border-blue-500' : 'border-gray-400'}`}>
                            <input
                                required
                                id='newPassword'
                                onFocus={() => setIsNewFocused(true)}
                                onBlur={() => setIsNewFocused(false)}
                                onChange={(e) => validateNewPassword(e.target.value)}
                                className='outline-0 flex-1 text-gray-700' type={showNewPassword ? 'text' : 'password'}
                                disabled={isLoading}
                            />
                            <Image
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className='cursor-pointer' src={showNewPassword ? '/eye.svg' : '/eye_close.svg'} width={18} height={18} alt='eye'/>
                        </div>
                    </div>
                    
                    <div className='flex flex-col gap-1'>
                        <label className={`${isConfirmFocused || confirmPassword ? 'text-blue-700' : 'text-gray-700'}`}>Confirm Password</label>
                        <div className={`flex items-center border-2 rounded-lg px-5 py-2 justify-between gap-2
                        ${isConfirmFocused || confirmPassword ? 'border-blue-500' : 'border-gray-400'}`}>
                            <input
                                required
                                id='confirmPassword'
                                onFocus={() => setIsConfirmFocused(true)}
                                onBlur={() => setIsConfirmFocused(false)}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className='outline-0 flex-1 text-gray-700' type={showConfirmPassword ? 'text' : 'password'}
                                disabled={isLoading}
                            />
                            <Image
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className='cursor-pointer' src={showConfirmPassword ? '/eye.svg' : '/eye_close.svg'} width={18} height={18} alt='eye'/>
                        </div>
                    </div>
                    
                    <div className='flex flex-col gap-1 mt-2'>
                        <div className='flex items-center gap-2'>
                            <div className={`w-3 h-3 transition duration-300 rounded-full ${rq1 ? 'bg-green-300' : newPassword ? 'bg-red-300' : 'bg-gray-300'}`}></div>
                            <p className={`text-sm transition duration-300 ${rq1 ? 'text-green-500' : newPassword ? 'text-red-500' : 'text-gray-800'}`}>Minimum of 7 characters</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className={`w-3 h-3 transition duration-300 rounded-full ${rq2 ? 'bg-green-300' : newPassword ? 'bg-red-300' : 'bg-gray-300'}`}></div>
                            <p className={`text-sm transition duration-300 ${rq2 ? 'text-green-500' : newPassword ? 'text-red-500' : 'text-gray-800'}`}>Must contain uppercase and lowercase</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className={`w-3 h-3 transition duration-300 rounded-full ${rq3 ? 'bg-green-300' : newPassword ? 'bg-red-300' : 'bg-gray-300'}`}></div>
                            <p className={`text-sm transition duration-300 ${rq3 ? 'text-green-500' : newPassword ? 'text-red-500' : 'text-gray-800'}`}>Must contain special character (e.g, -!@_#&)</p>
                        </div>
                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <div className='flex items-center gap-2 mt-1'>
                                <div className='w-3 h-3 transition duration-300 rounded-full bg-red-400'></div>
                                <p className='text-sm text-red-500'>Passwords do not match</p>
                            </div>
                        )}
                    </div>
                    
                    <div className='flex justify-end my-2'>
                        <input 
                            className='font-bold rounded-lg bg-red-800 cursor-pointer text-white px-6 py-2 hover:bg-red-700 transition-colors' 
                            type='submit' 
                            value={isLoading ? 'Saving...' : 'Save Changes'}
                            disabled={isLoading}
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}