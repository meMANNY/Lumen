import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  CirclePlus,
  Ellipsis,
  FileText,
  Flame,
  Hash,
  Image,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Search,
  SendHorizontal,
  Settings2,
  Smile,
  Sparkles,
  Users,
} from "lucide-react";

const conversations = [
  { name: "Maya Chen", preview: "The prototype is ready to review.", time: "10:42", initials: "MC", color: "bg-rose-400", unread: 2, active: true },
  { name: "Design Circle", preview: "Noah: Love the new direction ✨", time: "09:16", initials: "DC", color: "bg-amber-400", unread: 0 },
  { name: "Oliver Grant", preview: "I’ve left a note on the brief.", time: "Tue", initials: "OG", color: "bg-sky-400", unread: 0 },
  { name: "Studio updates", preview: "Ada: Friday’s demo is locked in.", time: "Mon", initials: "SU", color: "bg-violet-400", unread: 0 },
];

const messages = [
  { from: "Maya", text: "Morning! I pulled together a first pass of the revised home flow.", time: "10:31", avatar: "MC", color: "bg-rose-400" },
  { from: "Maya", text: "I wanted it to feel more editorial—less dashboard, more space to think.", time: "10:32", avatar: "MC", color: "bg-rose-400" },
  { mine: true, text: "That’s exactly the direction. The hierarchy feels much calmer already.", time: "10:38" },
  { mine: true, text: "Could you share the mobile states too?", time: "10:38" },
  { from: "Maya", text: "Absolutely. I’ve put the working file and a quick walkthrough below.", time: "10:42", avatar: "MC", color: "bg-rose-400", attachment: true },
];

function Avatar({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-7 text-[9px]", md: "size-10 text-xs", lg: "size-12 text-sm" };
  return <div className={`${sizes[size]} ${color} grid shrink-0 place-items-center rounded-full font-semibold tracking-wide text-slate-950`}>{initials}</div>;
}

export default function App() {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const current = conversations[selected];
  const allMessages = useMemo(() => [...messages, ...sent.map((text) => ({ mine: true, text, time: "Now" }))], [sent]);

  const sendMessage = () => {
    const cleaned = message.trim();
    if (!cleaned) return;
    setSent((previous) => [...previous, cleaned]);
    setMessage("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b14] font-[Manrope] text-slate-100 selection:bg-violet-300/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_13%_7%,rgba(117,80,219,0.22),transparent_25%),radial-gradient(circle_at_82%_20%,rgba(28,128,147,0.13),transparent_28%),radial-gradient(circle_at_64%_100%,rgba(139,63,122,0.13),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.26] [background-image:linear-gradient(rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] p-3 sm:p-5">
        <section className="flex min-h-[calc(100vh-24px)] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#10121d]/85 shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:min-h-[calc(100vh-40px)]">
          <nav className="hidden w-[84px] shrink-0 flex-col items-center border-r border-white/[0.07] bg-[#0d0f19]/65 py-6 lg:flex">
            <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-rose-300 shadow-lg shadow-fuchsia-950/30">
              <MessageCircle className="size-5 text-slate-950" strokeWidth={2.4} />
            </div>
            <div className="mt-10 flex flex-col gap-4">
              {[{ icon: MessageCircle, active: true }, { icon: Users }, { icon: Bell }].map(({ icon: Icon, active }, index) => (
                <button key={index} className={`group relative grid size-11 place-items-center rounded-2xl transition ${active ? "bg-white/[0.11] text-white" : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"}`} aria-label="Navigation item">
                  {active && <span className="absolute -left-[21px] h-5 w-1 rounded-r-full bg-violet-300" />}
                  <Icon className="size-[19px]" />
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-4">
              <button className="grid size-11 place-items-center rounded-2xl text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200" aria-label="Settings"><Settings2 className="size-[18px]" /></button>
              <Avatar initials="JS" color="bg-lime-300" size="sm" />
            </div>
          </nav>

          <aside className="hidden w-[335px] shrink-0 border-r border-white/[0.07] bg-[#12141f]/72 md:flex md:flex-col">
            <div className="px-6 pb-4 pt-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-[DM_Mono] text-[10px] uppercase tracking-[0.22em] text-violet-300">Lumen / inbox</p>
                  <h1 className="mt-1.5 font-[Fraunces] text-[27px] font-medium tracking-[-0.025em] text-white">Conversations</h1>
                </div>
                <button className="grid size-10 place-items-center rounded-xl bg-white/[0.08] text-slate-200 transition hover:bg-violet-400 hover:text-[#171222]" aria-label="New conversation"><CirclePlus className="size-5" /></button>
              </div>
              <label className="mt-6 flex h-11 items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 text-slate-500 focus-within:border-violet-300/40 focus-within:ring-2 focus-within:ring-violet-400/10">
                <Search className="size-4" />
                <input className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" placeholder="Search messages" />
                <span className="rounded border border-white/10 px-1.5 py-0.5 font-[DM_Mono] text-[9px] text-slate-500">⌘K</span>
              </label>
            </div>

            <div className="flex items-center gap-4 border-b border-white/[0.07] px-6">
              <button className="border-b-2 border-violet-300 pb-3 font-[DM_Mono] text-[10px] uppercase tracking-[0.13em] text-white">All messages</button>
              <button className="pb-3 font-[DM_Mono] text-[10px] uppercase tracking-[0.13em] text-slate-500 hover:text-slate-300">Unread <span className="ml-1 text-violet-300">2</span></button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 font-[DM_Mono] text-[10px] uppercase tracking-[0.19em] text-slate-500">Today</p>
              {conversations.map((conversation, index) => (
                <button onClick={() => setSelected(index)} key={conversation.name} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selected === index ? "bg-gradient-to-r from-violet-400/[0.16] to-transparent shadow-[inset_1px_0_0_rgba(196,181,253,0.65)]" : "hover:bg-white/[0.045]"}`}>
                  <div className="relative"><Avatar initials={conversation.initials} color={conversation.color} /><span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#141621] bg-emerald-400" /></div>
                  <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-100">{conversation.name}</span><span className={`font-[DM_Mono] text-[10px] ${selected === index ? "text-violet-200" : "text-slate-500"}`}>{conversation.time}</span></div><p className="mt-1 truncate text-[12px] text-slate-500">{conversation.preview}</p></div>
                  {conversation.unread > 0 && <span className="grid size-5 place-items-center rounded-full bg-violet-300 font-[DM_Mono] text-[10px] font-bold text-violet-950">{conversation.unread}</span>}
                </button>
              ))}
            </div>
            <button className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-left transition hover:bg-white/[0.07]"><Sparkles className="size-4 text-amber-300" /><span><span className="block text-xs font-semibold text-slate-200">Your AI recap is ready</span><span className="block pt-0.5 text-[11px] text-slate-500">A calm review of your day</span></span></button>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-[#11131e]/40">
            <header className="flex h-[88px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
              <div className="flex items-center gap-3"><div className="relative"><Avatar initials={current.initials} color={current.color} size="lg" /><span className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-[3px] border-[#141621] bg-emerald-400" /></div><div><div className="flex items-center gap-2"><h2 className="text-[15px] font-semibold text-white">{current.name}</h2><ChevronDown className="size-3.5 text-slate-500" /></div><p className="mt-0.5 text-xs text-emerald-300">Active now</p></div></div>
              <div className="flex gap-1"><button className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white" aria-label="Search conversation"><Search className="size-[18px]" /></button><button className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white" aria-label="More options"><Ellipsis className="size-[19px]" /></button></div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10">
              <div className="mx-auto max-w-3xl">
                <div className="mb-8 flex items-center gap-4"><div className="h-px flex-1 bg-white/[0.07]" /><span className="font-[DM_Mono] text-[10px] uppercase tracking-[0.18em] text-slate-500">Tuesday, 14 July</span><div className="h-px flex-1 bg-white/[0.07]" /></div>
                <div className="space-y-5">
                  {allMessages.map((item, index) => item.mine ? (
                    <div className="flex justify-end" key={`${item.text}-${index}`}><div className="max-w-[78%]"><div className="rounded-[19px] rounded-br-md bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-500 px-4 py-3 text-[14px] leading-6 text-white shadow-lg shadow-violet-950/25">{item.text}</div><p className="mt-1.5 text-right font-[DM_Mono] text-[10px] text-slate-500">{item.time} <span className="text-violet-300">✓✓</span></p></div></div>
                  ) : (
                    <div className="flex max-w-[88%] gap-3" key={`${item.text}-${index}`}><Avatar initials={item.avatar!} color={item.color!} size="sm" /><div><p className="mb-1 font-[DM_Mono] text-[10px] uppercase tracking-[0.14em] text-slate-500">{item.from} <span className="ml-1 normal-case tracking-normal">{item.time}</span></p><div className="rounded-[19px] rounded-tl-md border border-white/[0.07] bg-white/[0.055] px-4 py-3 text-[14px] leading-6 text-slate-200 shadow-sm">{item.text}</div>{item.attachment && <button className="mt-3 flex w-[260px] items-center gap-3 rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-300/10 to-transparent p-3 text-left transition hover:border-violet-300/35"><div className="grid size-10 place-items-center rounded-xl bg-violet-300/15 text-violet-200"><FileText className="size-5" /></div><span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-100">Home flow — working file</span><span className="mt-0.5 block font-[DM_Mono] text-[10px] text-slate-500">FIG · 8.4 MB</span></span><MoreHorizontal className="ml-auto size-4 text-slate-500" /></button>}</div></div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="px-5 pb-5 pt-2 sm:px-8 sm:pb-8">
              <div className="mx-auto max-w-3xl rounded-[22px] border border-white/[0.09] bg-[#0a0c15]/75 p-2 shadow-2xl shadow-black/20 transition focus-within:border-violet-300/35 focus-within:shadow-violet-950/20">
                <div className="flex items-end gap-1"><button className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/[0.07] hover:text-violet-200" aria-label="Attach file"><Paperclip className="size-[18px]" /></button><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm leading-5 text-slate-100 outline-none placeholder:text-slate-600" placeholder={`Message ${current.name}`} rows={1} /><button className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white/[0.07] hover:text-amber-200" aria-label="Add emoji"><Smile className="size-[18px]" /></button><button onClick={sendMessage} className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-300 text-violet-950 shadow-lg shadow-violet-950/20 transition hover:scale-[1.04] hover:bg-violet-200 active:scale-95" aria-label="Send message"><SendHorizontal className="size-[18px]" /></button></div>
              </div>
              <p className="mx-auto mt-3 max-w-3xl text-center font-[DM_Mono] text-[9px] uppercase tracking-[0.12em] text-slate-600">Enter to send · Shift + Enter for a new line</p>
            </footer>
          </section>

          <aside className="hidden w-[250px] shrink-0 border-l border-white/[0.07] bg-[#10121b]/60 px-6 py-8 2xl:block">
            <div className="flex items-center justify-between"><p className="font-[DM_Mono] text-[10px] uppercase tracking-[0.18em] text-slate-500">Shared space</p><button className="text-slate-500 hover:text-white"><MoreHorizontal className="size-4" /></button></div>
            <div className="mt-7 text-center"><Avatar initials={current.initials} color={current.color} size="lg" /><p className="mt-3 text-sm font-semibold text-white">{current.name}</p><p className="mt-1 text-xs text-slate-500">Product designer · New York</p><button className="mt-4 rounded-lg border border-white/[0.08] px-3 py-1.5 font-[DM_Mono] text-[10px] uppercase tracking-[0.13em] text-violet-200 transition hover:bg-white/[0.06]">View profile</button></div>
            <div className="mt-9 border-t border-white/[0.07] pt-6"><p className="font-[DM_Mono] text-[10px] uppercase tracking-[0.17em] text-slate-500">Pinned</p><div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3"><Flame className="size-4 text-orange-300" /><p className="mt-2 text-xs leading-5 text-slate-300">“Make the experience feel like a place people want to return to.”</p><p className="mt-2 font-[DM_Mono] text-[9px] text-slate-600">JUL 11 · MAYA</p></div></div>
            <div className="mt-8"><p className="font-[DM_Mono] text-[10px] uppercase tracking-[0.17em] text-slate-500">Media & files</p><div className="mt-4 grid grid-cols-3 gap-2"><div className="aspect-square rounded-lg bg-gradient-to-br from-amber-200/70 to-rose-400/70" /><div className="aspect-square rounded-lg bg-gradient-to-br from-sky-300/70 to-violet-500/70" /><div className="grid aspect-square place-items-center rounded-lg bg-white/[0.06] text-slate-500"><Image className="size-4" /></div></div></div>
          </aside>
        </section>
      </div>
    </main>
  );
}
