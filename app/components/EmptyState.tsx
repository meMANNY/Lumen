
export default function EmptyState() {
  return (
    <div className="px-4 py-10 sm:px-8 lg:px-8 h-full flex justify-center items-center bg-[#070b14] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#070b14] to-[#070b14]">
        <div className="text-center items-center flex flex-col max-w-sm">
            <div className="relative mb-6 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-md">
                <svg className="w-12 h-12 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"></path>
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">
                Welcome to your workspace
            </h3>
            <p className="mt-2 text-sm text-slate-400">
                Select an existing conversation from the sidebar or search for a user to start a new chat.
            </p>
        </div>
    </div>
  )
}

