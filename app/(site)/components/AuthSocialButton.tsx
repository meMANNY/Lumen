import { IconType } from "react-icons"

interface AuthSocialButtonProps{
  icon: IconType,
  onClick: ()=>void;
}

const AuthSocialButton: React.FC<AuthSocialButtonProps> = ({ 
  icon: Icon,
  onClick
}) => {
  return ( 
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex
        w-full
        justify-center
        rounded-lg
        bg-slate-900/50
        px-4
        py-2.5
        text-slate-300
        shadow-sm
        ring-1
        ring-inset
        ring-slate-800/80
        hover:bg-slate-800/80
        hover:text-slate-100
        hover:scale-[1.03]
        active:scale-[0.97]
        transition-all
        duration-200
        focus:outline-offset-0
      "
    >
      <Icon size={20} />
    </button>
   );
}


export default AuthSocialButton
