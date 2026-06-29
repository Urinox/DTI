// components/COS-JOS/Popup/OvertimePopup.tsx
import { useState } from "react"
import axios from "axios"

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
        <div className='flex flex-col bg-white rounded-lg border border-black shadow-2xl max-h-[90vh] max-w-[500px] w-[90%]'>
            {/* Header - Fixed */}
            <div className='flex pl-5 items-center w-full border-b border-gray-300 py-4 flex-shrink-0'>
                <p className='text-xl font-bold'>New Overtime</p>
            </div>
            
            {/* Error message - Fixed */}
            {error && (
                <div className="mx-5 mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm flex-shrink-0">
                    ❌ {error}
                </div>
            )}
            
            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
                <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Date *</label>
                        <input
                            required
                            onChange={(e) => setDate(e.target.value)}
                            type='date'
                            className='border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Start Time *</label>
                        <input
                            required
                            onChange={(e) => setStartTime(e.target.value)}
                            type='time'
                            className='border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>End Time *</label>
                        <input
                            required
                            onChange={(e) => setEndTime(e.target.value)}
                            type='time'
                            className='border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Purpose *</label>
                        <textarea
                            required
                            onChange={(e) => setPurpose(e.target.value)}
                            rows={2}
                            className='outline-0 border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-sm resize-none'
                            placeholder='Enter purpose'
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-bold text-gray-700 text-sm'>Destination *</label>
                        <input
                            required
                            onChange={(e) => setDestination(e.target.value)}
                            type='text'
                            placeholder='Enter destination'
                            className='border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
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