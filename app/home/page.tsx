"use client"
import { useState,useEffect } from "react"
import Image from "next/image"
import axios from "axios"
import {useSession} from "next-auth/react"
import Loading from "@/components/Loading"

export default function Home() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [division, setDivision] = useState('')
    const [office, setOffice] = useState('')
    const [designation, setDesignation] = useState('')
    const [isNameFocused, setIsNameFocused] = useState(false)
    const [isEmailFocused, setIsEmailFocused] = useState(false)
    const [isDivisionFocused, setIsDivisionFocused] = useState(false)
    const [isOfficeFocused, setIsOfficeFocused] = useState(false)
    const [isDesignationFocused, setIsDesignationFocused] = useState(false)

    const {data: session, status} = useSession()
    const [loading, setLoading] = useState(true)

    async function handleSubmit(e:any){
        e.preventDefault()
        try{
            await axios.post(`/api/profile/${session.user.id}`, {
                name: name,
                email: email,
                division: division,
                office: office,
                designation: designation
            })
            await checkProfile()
        } catch (err){
            console.log(err)
        }
    }

    async function checkProfile(){
        const data = await axios.post(`/api/profile/${session.user.id}`)
        if(data.data.data != null){
            window.location.href = `/home/${session.user.role}`
        }
    }

    useEffect(() => {
        if(status == 'unauthenticated') {
            window.location.href = '/'
        }
        setTimeout(() => {
            setLoading(false)
        }, 3000)
    }, [session, status]);

    if (status === 'loading' || !session || loading) return <Loading/>

    return(
        <main className='flex items-center justify-center h-screen bg-[rgba(3,7,61,1)]'>
            <div className='bg-white flex items-center flex-col gap-8 py-5 px-10 rounded-lg w-96'>
                <div className='flex gap-5'>
                    <Image src={'/dti_logo.png'} width={70} height={70} alt='DTI Logo'/>
                    <Image src={'/bagong_pilipinas_logo.png'} width={70} height={70} alt='Bagong Pilipinas Logo'/>
                </div>
                <p className='font-bold'>Please enter your details</p>
                <form onSubmit={handleSubmit} className='flex flex-col items-center w-full gap-5 mt-2'>
                    <div className='flex items-center justify-center relative w-full mb-3'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                        ${isNameFocused || name ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Name</label>
                        <input
                            required
                            onFocus={() => setIsNameFocused(true)}
                            onBlur={() => setIsNameFocused(false)}
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            className={`border-b-[1] outline-0 w-full pb-1 text-sm
                            ${isNameFocused || name ? 'border-blue-500' : 'border-gray-400'}`}/>
                    </div>
                    <div className='flex items-center justify-center relative w-full mb-3'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                        ${isEmailFocused || email ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Email</label>
                        <input
                            required
                            onFocus={() => setIsEmailFocused(true)}
                            onBlur={() => setIsEmailFocused(false)}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            className={`border-b-[1] outline-0 w-full pb-1 text-sm
                            ${isEmailFocused || email ? 'border-blue-500' : 'border-gray-400'}`}/>
                    </div>
                    <div className='flex items-center justify-center relative w-full mb-3'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                        ${isDivisionFocused || division ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Division</label>
                        <input
                            onFocus={() => setIsDivisionFocused(true)}
                            onBlur={() => setIsDivisionFocused(false)}
                            onChange={(e) => setDivision(e.target.value)}
                            type="text"
                            className={`border-b-[1] outline-0 w-full pb-1 text-sm
                            ${isDivisionFocused || division ? 'border-blue-500' : 'border-gray-400'}`}/>
                    </div>
                    <div className='flex items-center justify-center relative w-full mb-3'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                        ${isOfficeFocused || office ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Office</label>
                        <input
                            required
                            onFocus={() => setIsOfficeFocused(true)}
                            onBlur={() => setIsOfficeFocused(false)}
                            onChange={(e) => setOffice(e.target.value)}
                            type="text"
                            className={`border-b-[1] outline-0 w-full pb-1 text-sm
                            ${isOfficeFocused || office ? 'border-blue-500' : 'border-gray-400'}`}/>
                    </div>
                    <div className='flex items-center justify-center relative w-full'>
                        <label className={`absolute left-0 transition-all duration-150 bottom-1
                        ${isDesignationFocused || designation ? 'text-blue-500 -translate-y-6 text-sm' : 'text-gray-400'}`}>Designation</label>
                        <input
                            required
                            onFocus={() => setIsDesignationFocused(true)}
                            onBlur={() => setIsDesignationFocused(false)}
                            onChange={(e) => setDesignation(e.target.value)}
                            type="text"
                            className={`border-b-[1] outline-0 w-full pb-1 text-sm
                            ${isDesignationFocused || designation ? 'border-blue-500' : 'border-gray-400'}`}/>
                    </div>
                    <input className='bg-red-800 w-[80%] rounded-full py-1 font-semibold text-white cursor-pointer mb-5' type="submit" value="Log in"/>
                </form>
            </div>
        </main>
    )
}