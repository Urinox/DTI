"use client"
import Image from "next/image"
import { useState,useEffect } from "react"
import {signIn} from "next-auth/react"
import {useSession} from "next-auth/react"
import Loading from "@/components/Loading"
import axios from "axios";


export default function Home() {
    const [isUsernameFocused, setIsUsernameFocused] = useState(false)
    const [isPassFocused, setIsPassFocused] = useState(false)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [rq1, setRq1] = useState(false)
    const [rq2, setRq2] = useState(false)
    const [rq3, setRq3] = useState(false)

    const {data: session, status} = useSession()

    function checkPassword(password:string){
        setPassword(password)
        if(password.length >= 7){
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

    async function handleSubmit(e:any){
        e.preventDefault()
        if (!checkPassword(password)) return null
        try{
            const result = await signIn('credentials', {username: name, password: password, redirect: false})
            if(result.error){
                alert('Invalid Username or Password')
            }
        }catch (err){
            console.log(err)
        }
    }

async function checkProfile(){
    // Add this guard clause at the beginning
    if (!session || !session.user) {
        console.log('No session or user found');
        return;
    }
    
    const data = await axios.get(`/api/profile/${session.user.id}`)
    if(data.data.data != null){
        window.location.href = `/home/${session.user.role}`
    }else{
        window.location.href = '/home'
    }
}

    useEffect(() => {
        if(session){
            checkProfile()
        }
    }, [session, status])

    if (status === 'loading' || status === 'authenticated') return <Loading/>

    if(status === 'unauthenticated'){
        return (
            <main className='flex items-center justify-center h-screen bg-[rgba(3,7,61,1)]'>
                <div className='bg-white flex items-center flex-col gap-8 py-5 px-10 rounded-lg'>
                    <div className='flex gap-5'>
                        <Image src={'/dti_logo.png'} width={70} height={70} alt='DTI Logo'/>
                        <Image src={'/bagong_pilipinas_logo.png'} width={70} height={70} alt='Bagong Pilipinas Logo'/>
                    </div>
                    <p className='font-bold'>Please enter your details</p>
                    <form
                        onSubmit={handleSubmit}
                        className='flex flex-col items-center w-full gap-5 mt-2'>
                        <div className='flex items-center justify-center relative w-full mb-5'>
                            <label className={`absolute left-0 transition-all duration-150 bottom-1
                  ${isUsernameFocused || name ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Username</label>
                            <input
                                required
                                onFocus={() => setIsUsernameFocused(true)}
                                onBlur={() => setIsUsernameFocused(false)}
                                onChange={(e) => setName(e.target.value)}
                                type="text" className={`border-b-[1] outline-0 w-full pb-1 text-sm
                      ${isUsernameFocused || name ? 'border-blue-500' : 'border-gray-400'}`}/>
                        </div>
                        <div className='flex items-center justify-center relative w-full'>
                            <label className={`absolute left-0 transition-all duration-150 bottom-1
                  ${isPassFocused || password ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Password</label>
                            <input
                                required
                                onFocus={() => setIsPassFocused(true)}
                                onBlur={() => setIsPassFocused(false)}
                                onChange={(e) => checkPassword(e.target.value)}
                                type="password" className={`border-b-[1] outline-0 w-full pb-1 text-sm
                      ${isPassFocused || password ? 'border-blue-500' : 'border-gray-400'}`}/>
                        </div>
                        <div className='flex flex-col gap-2 w-full'>
                            <div className='flex items-center gap-2'>
                                <div className={`w-3 h-3 transition duration-300 rounded-full ${rq1 ? 'bg-green-300' : password != '' ? 'bg-red-300' : 'bg-gray-300'}`}></div>
                                <p className={`text-sm transition duration-300 ${rq1 ? 'text-green-500' : password != '' ? 'text-red-500' : 'text-gray-800'}`}>Minimum of 7 characters</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <div className={`w-3 h-3 transition duration-300 rounded-full ${rq2 ? 'bg-green-300' : password != '' ? 'bg-red-300' : 'bg-gray-300'}`}></div>
                                <p className={`text-sm transition duration-300 ${rq2 ? 'text-green-500' : password != '' ? 'text-red-500' : 'text-gray-800'}`}>Must contain uppercase and lowercase</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <div className={`w-3 h-3 transition duration-300 rounded-full ${rq3 ? 'bg-green-300' : password != '' ? 'bg-red-300' : 'bg-gray-300'}`}></div>
                                <p className={`text-sm transition duration-300 ${rq3 ? 'text-green-500' : password != '' ? 'text-red-500' : 'text-gray-800'}`}>Must contain special character (e.g, -!@_#&)</p>
                            </div>
                        </div>
                        <input className='bg-red-800 w-[80%] rounded-full py-1 font-semibold text-white cursor-pointer mb-5' type="submit" value="Log in"/>
                    </form>
                </div>
            </main>
        )
    }
}
