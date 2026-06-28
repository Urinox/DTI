// components/COS-JOS/Popup/TravelOrderPopup.tsx
import { useState } from "react"
import axios from "axios"

export default function TravelOrderPopup({
    showPopup,
    id,
    getTravelOrder
}: {
    showPopup: () => void;
    id: string;
    getTravelOrder: () => void;
}) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [purpose, setPurpose] = useState('')
    const [expectedOutput, setExpectedOutput] = useState('')
    const [destination, setDestination] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: any) {
        e.preventDefault()
        setError('')

        if (!startDate || !endDate || !purpose || !expectedOutput || !destination) {
            setError('Please fill in all fields')
            return
        }

        setIsLoading(true)

        try {
            const response = await axios.post(`/api/travel_order/${id}`, {
                startDate: startDate,
                endDate: endDate,
                purpose: purpose,
                expectedOutput: expectedOutput,
                destination: destination
            })

            if (response.status === 200) {
                alert('✅ Travel order submitted successfully!')
                await getTravelOrder()
                showPopup()
            }
        } catch (error: any) {
            console.error('❌ Error creating travel order:', error)
            setError(error.response?.data?.message || 'Error submitting travel order. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return(
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[40%]'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>New Travel Order</p>
            </div>
            
            {error && (
                <div className='mx-5 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                    ❌ {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex flex-col gap-2 mr-80'>
                    <p className='font-bold'>Start Date</p>
                    <input 
                        type='date' 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'
                        required
                    />
                </div>
                <div className='flex flex-col gap-2 mr-80'>
                    <p className='font-bold'>End Date</p>
                    <input 
                        type='date' 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'
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
                    <p className='font-bold'>Expected Output</p>
                    <textarea 
                        rows={3} 
                        value={expectedOutput}
                        onChange={(e) => setExpectedOutput(e.target.value)}
                        className='outline-0 border-[1] border-gray-300 text-gray-700 rounded-lg px-3 py-2'
                        placeholder='Enter expected output'
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