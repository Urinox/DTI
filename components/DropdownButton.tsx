export default function DropdownButton({btnText, selected, onClick} : {btnText: string, selected: boolean, onClick: () => void}) {
    return(
        <button onClick={onClick} className={`text-white gap-2 flex items-center transition-all duration-150 ${selected?'bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] pl-16':'bg-black pl-12'} py-2 pr-10 cursor-pointer`}>
            <p className='font-semibold'>{btnText}</p>
        </button>
    )
}