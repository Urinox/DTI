'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Loading() {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])
    
    if (!mounted) {
        return null
    }
    
    return createPortal(
        <div className='fixed inset-0 w-screen h-screen flex justify-center items-center z-50'>
            <div className='flex flex-col gap-10 justify-center items-center text-white bg-blue-950 py-8 px-8 rounded-xl animate-bounce'>
                <div className='flex gap-5 animate-bounce'>
                    <div className='flex items-center justify-center w-6 h-6 bg-sky-300 rounded-full'>
                        <div className='w-3 h-3 rounded-full bg-white animate-ping'></div>
                    </div>
                    <div className='flex items-center justify-center w-6 h-6 bg-sky-300 rounded-full animate-bounce'>
                        <div className='w-3 h-3 rounded-full bg-white animate-ping'></div>
                    </div>
                    <div className='flex items-center justify-center w-6 h-6 bg-sky-300 rounded-full'>
                        <div className='w-3 h-3 rounded-full bg-white animate-ping'></div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}