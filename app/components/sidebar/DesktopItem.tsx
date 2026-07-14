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
    <li onClick={handleClick} key={label}>
      <Link
        href={href}
        className={clsx(`
            group 
            flex 
            gap-x-3 
            rounded-xl 
            p-3 
            text-sm 
            leading-6 
            font-semibold 
            text-slate-400 
            hover:text-indigo-400 
            hover:bg-slate-900/60
            hover:scale-[1.05]
            active:scale-[0.95]
            transition-all
            duration-200
          `,
            active && 'bg-slate-900 text-indigo-400 border border-slate-800/60 shadow-inner'
          )}
      >
        <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Link>
    </li>
   );

}
 
export default DesktopItem;