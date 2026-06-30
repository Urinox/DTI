// app/page.tsx
"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useSession } from "next-auth/react"
import Loading from "@/components/Loading"
import axios from "axios"
import { useRouter } from "next/navigation"
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, database, ref, get } from '@/lib/firebase'

export default function Home() {
    const [isEmailFocused, setIsEmailFocused] = useState(false)
    const [isPassFocused, setIsPassFocused] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [rq1, setRq1] = useState(false)
    const [rq2, setRq2] = useState(false)
    const [rq3, setRq3] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { data: session, status } = useSession()
    const router = useRouter()

    function checkPassword(password: string) {
        setPassword(password)
        if (password.length >= 7) {
            setRq1(true)
        } else {
            setRq1(false)
        }
        if (password.match(/[A-Z]/) && password.match(/[a-z]/)) {
            setRq2(true)
        } else {
            setRq2(false)
        }
        if (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/)) {
            setRq3(true)
        } else {
            setRq3(false)
        }
        return rq1 && rq2 && rq3
    }

    async function handleSubmit(e: any) {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        
        if (!checkPassword(password)) {
            setMessage('Please meet all password requirements')
            setLoading(false)
            return
        }
        
        try {
            // ✅ First, sign in with Firebase to check if account is disabled
            try {
                const firebaseUser = await signInWithEmailAndPassword(auth, email, password)
                
                // ✅ Check if user is disabled in database
                const userRef = ref(database, `users/${firebaseUser.user.uid}`)
                const userSnapshot = await get(userRef)
                
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val()
                    if (userData.disabled === true) {
                        // Sign out immediately
                        await signOut(auth)
                        setMessage('Your account has been disabled. Please contact the administrator.')
                        setLoading(false)
                        return
                    }
                }
                
                // If not disabled, proceed with NextAuth sign in
                const result = await signIn('credentials', { 
                    username: email,
                    password: password, 
                    redirect: false 
                })
                
                if (result?.error) {
                    setMessage('Invalid Email or Password')
                    setLoading(false)
                }
                
            } catch (firebaseError: any) {
                console.error('Firebase sign in error:', firebaseError)
                if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                    setMessage('Invalid Email or Password')
                } else if (firebaseError.code === 'auth/too-many-requests') {
                    setMessage('Too many failed attempts. Please try again later.')
                } else {
                    setMessage('An error occurred during login. Please try again.')
                }
                setLoading(false)
                return
            }
            
        } catch (err) {
            console.log(err)
            setMessage('An error occurred during login')
            setLoading(false)
        }
    }

    async function checkProfile() {
        if (!session || !session.user) {
            console.log('No session or user found')
            return
        }
        
        try {
            const userId = session.user.id
            console.log('✅ User authenticated:', userId)
            console.log('Email:', session.user.email)
            console.log('Role:', session.user.role)
            
            const response = await axios.get(`/api/profile/${userId}`)
            console.log('Profile check response:', response.data)
            
            const profile = response.data.data
            const hasValidProfile = profile && profile.profile && profile.profile.name && profile.profile.name.trim() !== ''
            
            if (hasValidProfile) {
                console.log('✅ Profile found with name, redirecting to dashboard')
                router.push(`/home/${session.user.role}`)
            } else {
                console.log('📝 No profile or empty profile - redirecting to create profile')
                router.push('/home')
            }
        } catch (error: any) {
            console.log('📝 Error fetching profile - redirecting to create profile')
            router.push('/home')
        }
    }

    useEffect(() => {
        if (session && status === 'authenticated') {
            checkProfile()
        }
    }, [session, status])

    if (status === 'loading') {
        return <Loading />
    }

    if (status === 'authenticated') {
        return <Loading />
    }

    return (
        <main className='flex items-center justify-center h-screen bg-[rgba(3,7,61,1)]'>
            <div className='bg-white flex items-center flex-col gap-8 py-5 px-10 rounded-lg min-w-[400px]'>
                <div className='flex gap-5'>
                    <Image src={'/dti_logo.png'} width={70} height={70} alt='DTI Logo'/>
                    <Image src={'/bagong_pilipinas_logo.png'} width={70} height={70} alt='Bagong Pilipinas Logo'/>
                </div>
                <p className='font-bold text-gray-800'>Please enter your details</p>
                
                {message && (
                    <div className={`w-full text-center text-sm p-2 rounded ${
                        message.includes('Invalid') || message.includes('error') || message.includes('disabled')
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-yellow-100 text-yellow-600'
                    }`}>
                        {message}
                    </div>
                )}
                
                <form
                    onSubmit={handleSubmit}
                    className='flex flex-col items-center w-full gap-5 mt-2'>
                    <div className='flex items-center justify-center relative w-full mb-5'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                            ${isEmailFocused || email ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>
                            Email
                        </label>
                        <input
                            required
                            type="email"
                            onFocus={() => setIsEmailFocused(true)}
                            onBlur={() => setIsEmailFocused(false)}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`border-b-[1px] outline-0 w-full pb-1 text-sm
                                ${isEmailFocused || email ? 'border-blue-500' : 'border-gray-400'}`}
                        />
                    </div>
                    
                    <div className='flex items-center justify-center relative w-full'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                            ${isPassFocused || password ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>
                            Password
                        </label>
                        <div className='flex items-center w-full border-b-[1px] pb-1'>
                            <input
                                required
                                onFocus={() => setIsPassFocused(true)}
                                onBlur={() => setIsPassFocused(false)}
                                onChange={(e) => checkPassword(e.target.value)}
                                type={showPassword ? "text" : "password"} 
                                className={`outline-0 w-full text-sm
                                    ${isPassFocused || password ? 'border-blue-500' : 'border-gray-400'}`}
                            />
                            <Image
                                onClick={() => setShowPassword(!showPassword)}
                                className='cursor-pointer ml-2'
                                src={showPassword ? '/eye.svg' : '/eye_close.svg'} 
                                width={18} 
                                height={18} 
                                alt={showPassword ? 'Hide password' : 'Show password'}
                            />
                        </div>
                    </div>
                    
                    <div className='flex flex-col gap-2 w-full'>
                        <div className='flex items-center gap-2'>
                            <div className={`w-3 h-3 transition duration-300 rounded-full 
                                ${rq1 ? 'bg-green-300' : password != '' ? 'bg-red-300' : 'bg-gray-300'}`}>
                            </div>
                            <p className={`text-sm transition duration-300 
                                ${rq1 ? 'text-green-500' : password != '' ? 'text-red-500' : 'text-gray-800'}`}>
                                Minimum of 7 characters
                            </p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className={`w-3 h-3 transition duration-300 rounded-full 
                                ${rq2 ? 'bg-green-300' : password != '' ? 'bg-red-300' : 'bg-gray-300'}`}>
                            </div>
                            <p className={`text-sm transition duration-300 
                                ${rq2 ? 'text-green-500' : password != '' ? 'text-red-500' : 'text-gray-800'}`}>
                                Must contain uppercase and lowercase
                            </p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className={`w-3 h-3 transition duration-300 rounded-full 
                                ${rq3 ? 'bg-green-300' : password != '' ? 'bg-red-300' : 'bg-gray-300'}`}>
                            </div>
                            <p className={`text-sm transition duration-300 
                                ${rq3 ? 'text-green-500' : password != '' ? 'text-red-500' : 'text-gray-800'}`}>
                                Must contain special character (e.g, -!@_#&)
                            </p>
                        </div>
                    </div>
                    
                    <input 
                        className='bg-red-800 w-[80%] rounded-full py-1 font-semibold text-white cursor-pointer mb-5 hover:bg-red-700 transition-colors disabled:opacity-50' 
                        type="submit" 
                        value={loading ? 'Logging in...' : 'Log in'}
                        disabled={loading}
                    />
                </form>
            </div>
        </main>
    )
}