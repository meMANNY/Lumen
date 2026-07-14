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
        hover:text-indigo-400 
        hover:bg-slate-900/40 
        transition-all
      `, 
        active && "bg-slate-900 text-indigo-400"
      )}
    >
        <Icon className="h-6 w-6" />
    </Link>
  )
}


export default MobileItem;