import AuthForm from "./components/AuthForm"

export default function Home() {
  return (
   <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#090b14] px-4 py-12 font-sans text-slate-100 selection:bg-violet-300/30">
    {/* Ambient glows — same recipe as the app shell */}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_7%,rgba(117,80,219,0.22),transparent_25%),radial-gradient(circle_at_82%_20%,rgba(28,128,147,0.13),transparent_28%),radial-gradient(circle_at_64%_100%,rgba(139,63,122,0.13),transparent_30%)]" />
    {/* Grid texture */}
    <div className="pointer-events-none absolute inset-0 opacity-[0.26] [background-image:linear-gradient(rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] [background-size:54px_54px]" />
    {/* Soft breathing blob behind the card */}
    <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-violet-500/[0.07] blur-3xl [animation-duration:7s]" />

    <AuthForm/>
   </div>
  )
}
