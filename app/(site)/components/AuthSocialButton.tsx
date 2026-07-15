import { IconType } from "react-icons"

interface AuthSocialButtonProps{
  icon: IconType,
  label: string,
  onClick: ()=>void;
}

const AuthSocialButton: React.FC<AuthSocialButtonProps> = ({
  icon: Icon,
  label,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      suppressHydrationWarning
      className="
        inline-flex
        w-full
        items-center
        justify-center
        gap-2.5
        rounded-xl
        border
        border-white/[0.08]
        bg-white/[0.04]
        px-4
        py-2.5
        text-sm
        font-medium
        text-slate-200
        transition-all
        duration-200
        hover:bg-white/[0.09]
        hover:text-white
        active:scale-[0.98]
        focus-visible:outline
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-violet-400
      "
    >
      <Icon size={18} />
      {label}
    </button>
   );
}


export default AuthSocialButton
