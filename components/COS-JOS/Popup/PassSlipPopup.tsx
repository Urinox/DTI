export default function PassSlipPopup({showPopup}:{showPopup: () => void}) {
    return(
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[40%]'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>New Pass Slip</p>
            </div>
            <form className='flex mx-5 gap-4 flex-col'>
                <div className='flex flex-col gap-2 mr-80'>
                    <p className='font-bold'>Date</p>
                    <input type='date' className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>Pass Slip Type</p>
                    <select className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'>
                        <option>Official</option>
                        <option>Personal</option>
                    </select>
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>Start Time</p>
                    <input type='time' className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>End Time</p>
                    <input type='time' className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Purpose</p>
                    <textarea rows={3} className='outline-0 border-[1] border-gray-300 text-gray-700'/>
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Destination</p>
                    <textarea rows={3} className='outline-0 border-[1] border-gray-300 text-gray-700'/>
                </div>
                <div className='flex items-center'>
                    <input type='button' value='Cancel' onClick={showPopup} className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                    <input type='submit' value='Add' className='bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                </div>
            </form>
        </div>
    )
}