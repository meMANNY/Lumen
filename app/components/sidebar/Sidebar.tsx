import getCurrentUser from "@/app/actions/getCurrentUser";
import DesktopSidebar from "./DesktopSidebar";
import MobileFooter from "./MobileFooter";


export default async function Sidebar({children}: {children: React.ReactNode}) {

  const currentUser = await getCurrentUser();
  return (
    <div className="relative h-dvh overflow-hidden bg-[#090b14] font-sans text-slate-100 selection:bg-violet-300/30">
      {/* Ambient backgrounds */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_7%,rgba(117,80,219,0.22),transparent_25%),radial-gradient(circle_at_82%_20%,rgba(28,128,147,0.13),transparent_28%),radial-gradient(circle_at_64%_100%,rgba(139,63,122,0.13),transparent_30%)]" />
      {/* Grid textures */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.26] [background-image:linear-gradient(rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="relative mx-auto flex h-full max-w-[1600px] p-3 sm:p-5">
        <section className="flex h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#10121d]/85 shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <DesktopSidebar currentUser={currentUser!} />
          <MobileFooter />
          <main className="flex-1 min-w-0 h-full overflow-hidden">
            {children}
          </main>
        </section>
      </div>
    </div>
  )
}

