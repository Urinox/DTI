// components/COS-JOS/Popup/OvertimePopup.tsx
import { useState } from "react"
import axios from "axios"
import Image from "next/image"

interface OvertimePopupProps {
    showPopup: () => void
    id: string
    getOvertimeRequest: () => void
}

export default function OvertimePopup({ showPopup, id, getOvertimeRequest }: OvertimePopupProps) {
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [purpose, setPurpose] = useState('')
    const [destination, setDestination] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: any) {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (!date || !startTime || !endTime || !purpose || !destination) {
            setError('Please fill in all required fields')
            setIsLoading(false)
            return
        }

        try {
            // Format date and times for the API
            const startDate = new Date(`${date}T${startTime}:00`)
            const endDate = new Date(`${date}T${endTime}:00`)

            console.log('Submitting overtime request for user:', id)
            console.log('📋 Data:', { startDate, endDate, purpose, destination })

            const response = await axios.post(`/api/overtime_request/${id}`, {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                purpose,
                destination,
                hours: '0'
            })

            console.log('✅ Overtime created:', response.data)

            await getOvertimeRequest()
            showPopup()
        } catch (err: any) {
            console.error('❌ Error creating overtime request:', err)
            console.error('Response data:', err.response?.data)
            setError(err.response?.data?.message || 'Error creating overtime request. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[40%] min-w-[400px] max-w-[500px] shadow-2xl'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>New Overtime</p>
            </div>
            
            {error && (
                <div className="mx-5 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                    ❌ {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex flex-col gap-2 mr-80'>
                    <p className='font-bold'>Date</p>
                    <input
                        required
                        onChange={(e) => setDate(e.target.value)}
                        type='date'
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-2 outline-0 focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>Start Time</p>
                    <input
                        required
                        onChange={(e) => setStartTime(e.target.value)}
                        type='time'
                        className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 py-2 outline-0 focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>End Time</p>
                    <input
                        required
                        onChange={(e) => setEndTime(e.target.value)}
                        type='time'
                        className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 py-2 outline-0 focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Purpose</p>
                    <textarea
                        required
                        onChange={(e) => setPurpose(e.target.value)}
                        rows={5}
                        className='outline-0 border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-2 focus:ring-2 focus:ring-blue-500'
                    />
                </div>

                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Destination</p>
                    <input
                        required
                        onChange={(e) => setDestination(e.target.value)}
                        type='text'
                        placeholder='Enter destination'
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-2 outline-0 focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                
                <div className='flex items-center justify-end mt-2 gap-3'>
                    <input 
                        type='button' 
                        value='Cancel' 
                        onClick={showPopup} 
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                    />
                    <input 
                        type='submit' 
                        value='Add' 
                        disabled={isLoading}
                        className='bg-red-800 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50'
                    />
                </div>
            </form>
        </div>
    )
}