import Image from "next/image";

export default function SidebarButton({btnText, btnIcon, selected, onClick} : {btnText: string, btnIcon: string, selected: boolean, onClick: () => void}) {
    return(
        <button onClick={onClick} className={`text-white flex items-center gap-2 ${selected?'bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]':'bg-black'} py-2 px-6 cursor-pointer w-full`}>
            <Image src={`/${btnIcon}`} width={25} height={25} alt=''/>
            <p className='text-lg font-semibold whitespace-nowrap'>{btnText}</p>
        </button>
    )
}