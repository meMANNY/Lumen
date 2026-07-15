'use client';

import Link from "next/link";
import clsx from "clsx";

interface MobileItemProps{
  href: string;
  icon: any;
  active?: boolean;
  onClick?: ()=>void;

}

const MobileItem:React.FC<MobileItemProps> =({
    href,
    icon: Icon,
    active,
    onClick}) =>{
      const handleClick =()=>{
        if(onClick){
          return onClick();
        }
      }
    

  return (
    <Link 
      onClick={handleClick}
      href={href}
      className={clsx(`
        group 
        flex 
        gap-x-3 
        text-sm 
        leading-6 
        font-semibold 
        w-full 
        justify-center 
        p-4 
        text-slate-400
        hover:text-violet-200
        hover:bg-white/[0.04]
        transition-all
      `,
        active && "bg-white/[0.06] text-violet-300"
      )}
    >
        <Icon className="h-6 w-6" />
    </Link>
  )
}


export default MobileItem;