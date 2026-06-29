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
        <div className='flex flex-col bg-white rounded-lg border border-black shadow-2xl max-h-[90vh] max-w-[500px] w-[90%]'>
            {/* Header - Fixed */}
            <div className='flex pl-5 items-center w-full border-b border-gray-300 py-4 flex-shrink-0'>
                <p className='text-xl font-bold'>New Travel Order</p>
            </div>
            
            {/* Error message - Fixed */}
            {error && (
                <div className='mx-5 mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm flex-shrink-0'>
                    ❌ {error}
                </div>
            )}
            
            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
                <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Start Date *</label>
                        <input 
                            type='date' 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className='border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                            required
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>End Date *</label>
                        <input 
                            type='date' 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className='border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                            required
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Purpose *</label>
                        <textarea 
                            rows={2} 
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className='outline-0 border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-sm resize-none'
                            placeholder='Enter purpose'
                            required
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Expected Output *</label>
                        <textarea 
                            rows={2} 
                            value={expectedOutput}
                            onChange={(e) => setExpectedOutput(e.target.value)}
                            className='outline-0 border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-sm resize-none'
                            placeholder='Enter expected output'
                            required
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Destination *</label>
                        <textarea 
                            rows={2} 
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className='outline-0 border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-sm resize-none'
                            placeholder='Enter destination'
                            required
                        />
                    </div>
                </form>
            </div>
            
            {/* Footer - Fixed */}
            <div className='flex items-center w-full justify-end px-5 py-4 border-t border-gray-300 gap-3 flex-shrink-0'>
                <button
                    type="button"
                    onClick={showPopup}
                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-1.5 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className='bg-red-800 text-white rounded-lg px-5 py-1.5 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50'
                >
                    {isLoading ? 'Submitting...' : 'Add'}
                </button>
            </div>
        </div>
    )
}