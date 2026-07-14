import clsx from 'clsx';
import Link from "next/link";

interface DesktopItemProps {
  label: string;
  icon: any;
  href: string;
  onClick?: () => void;
  active?: boolean;
}

const DesktopItem: React.FC<DesktopItemProps> = ({ 
  label, 
  href, 
  icon: Icon, 
  active,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      return onClick();
    }
  };

  return ( 
    <li onClick={handleClick} key={label} className="relative flex items-center justify-center">
      {active && (
        <span className="absolute -left-[21px] h-5 w-1 rounded-r-full bg-violet-300" />
      )}
      <Link
        href={href}
        className={clsx(`
            group 
            relative 
            grid 
            size-11 
            place-items-center 
            rounded-2xl 
            transition-all
            duration-200
            hover:scale-105
            active:scale-95
          `,
            active ? "bg-white/[0.11] text-white" : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
          )}
      >
        <Icon className="size-[19px]" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Link>
    </li>
   );

}
 
export default DesktopItem;