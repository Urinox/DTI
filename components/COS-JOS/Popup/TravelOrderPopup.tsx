import {useState} from "react"
import axios from "axios"

export default function TravelOrderPopup({showPopup, id, getTravelOrder}:{showPopup: () => void, id: string, getTravelOrder: () => void}) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [purpose, setPurpose] = useState('')
    const [expectedOutput, setExpectedOutput] = useState('')
    const [destination, setDestination] = useState('')

    async function handleSubmit(e:any){
        e.preventDefault()
        try{
            const formattedStartDate = new Date(startDate)
            const formattedEndDate = new Date(endDate)
            await axios.post(`/api/travel_order/${id}`, {startDate: formattedStartDate, endDate: formattedEndDate, purpose, expectedOutput, destination})
            alert('Travel added successfully')
            getTravelOrder()
            showPopup()
        }catch (err){
            console.log(err)
        }
    }

    return(
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[40%]'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>New Travel</p>
            </div>
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex flex-col gap-2 mt-3'>
                    <div className='flex w-full gap-10'>
                        <div className='flex'>
                            <p className='font-bold'>Start Date</p>
                            <input
                                required
                                onChange={(e) => setStartDate(e.target.value)}
                                type='date'
                                className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                        </div>
                        <div className='flex'>
                            <p className='font-bold'>End Date</p>
                            <input
                                required
                                onChange={(e) => setEndDate(e.target.value)}
                                type='date'
                                className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Purpose</p>
                    <textarea
                        required
                        onChange={(e) => setPurpose(e.target.value)}
                        rows={3}
                        className='outline-0 border-[1] border-gray-300 text-gray-700'/>
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Expected Output</p>
                    <textarea
                        required
                        onChange={(e) => setExpectedOutput(e.target.value)}
                        rows={3}
                        className='outline-0 border-[1] border-gray-300 text-gray-700'/>
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Destination</p>
                    <textarea
                        required
                        onChange={(e) => setDestination(e.target.value)}
                        rows={3}
                        className='outline-0 border-[1] border-gray-300 text-gray-700'/>
                </div>
                <div className='flex items-center'>
                    <input type='button' value='Cancel' onClick={showPopup} className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                    <input type='submit' value='Add' className='bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                </div>
            </form>
        </div>
    )
}