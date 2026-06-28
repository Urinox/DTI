// components/COS-JOS/Popup/PassSlipPopup.tsx
import { useState } from "react"
import axios from "axios"

export default function PassSlipPopup({
    showPopup,
    id,
    getPassSlip
}: {
    showPopup: () => void;
    id: string;
    getPassSlip: () => void;
}) {
    const [date, setDate] = useState('')
    const [type, setType] = useState('Official')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [purpose, setPurpose] = useState('')
    const [destination, setDestination] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: any) {
        e.preventDefault()
        setError('')

        if (!date || !startTime || !endTime || !purpose || !destination) {
            setError('Please fill in all fields')
            return
        }

        setIsLoading(true)

        try {
            // Combine date with startTime and endTime to create full datetime strings
            const startDateTime = new Date(`${date}T${startTime}:00`)
            const endDateTime = new Date(`${date}T${endTime}:00`)

            console.log('📤 Submitting pass slip for user:', id)
            console.log('📋 Data:', { startDate: startDateTime, endDate: endDateTime, type, purpose, destination })
            
            const response = await axios.post(`/api/pass_slip/${id}`, {
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                type: type,
                purpose: purpose,
                destination: destination
            })

            if (response.status === 200) {
                alert('✅ Pass slip submitted successfully!')
                await getPassSlip()
                showPopup()
            }
        } catch (error: any) {
            console.error('❌ Error creating pass slip:', error)
            setError(error.response?.data?.message || 'Error submitting pass slip. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return(
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[40%]'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>New Pass Slip</p>
            </div>
            
            {error && (
                <div className='mx-5 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                    ❌ {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex flex-col gap-2 mr-80'>
                    <p className='font-bold'>Date</p>
                    <input 
                        type='date' 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'
                        required
                    />
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>Pass Slip Type</p>
                    <select 
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'
                    >
                        <option value='Official'>Official</option>
                        <option value='Personal'>Personal</option>
                        <option value='Emergency'>Emergency</option>
                    </select>
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>Start Time</p>
                    <input 
                        type='time' 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'
                        required
                    />
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>End Time</p>
                    <input 
                        type='time' 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'
                        required
                    />
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Purpose</p>
                    <textarea 
                        rows={3} 
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className='outline-0 border-[1] border-gray-300 text-gray-700 rounded-lg px-3 py-2'
                        placeholder='Enter purpose'
                        required
                    />
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Destination</p>
                    <textarea 
                        rows={3} 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className='outline-0 border-[1] border-gray-300 text-gray-700 rounded-lg px-3 py-2'
                        placeholder='Enter destination'
                        required
                    />
                </div>
                <div className='flex items-center'>
                    <input 
                        type='button' 
                        value='Cancel' 
                        onClick={showPopup} 
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5 hover:bg-gray-100 transition-colors'
                    />
                    <input 
                        type='submit' 
                        value={isLoading ? 'Submitting...' : 'Add'} 
                        disabled={isLoading}
                        className='bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5 hover:bg-red-700 transition-colors disabled:opacity-50'
                    />
                </div>
            </form>
        </div>
    )
}