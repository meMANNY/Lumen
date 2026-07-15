'use client';


import { User } from "@prisma/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiSearch } from "react-icons/hi";

import UserBox from "./UserBox";

interface UserListProps {
  items: User[];
}

const UserList: React.FC<UserListProps> = ({
  items,
}) => {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K focuses the search field
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return items;
    }
    return items.filter((user) =>
      (user.name || '').toLowerCase().includes(trimmed) ||
      (user.email || '').toLowerCase().includes(trimmed)
    );
  }, [items, query]);

  return (
    <aside
      className="
        w-full
        md:w-[335px]
        shrink-0
        border-r
        border-white/[0.07]
        bg-[#12141f]/72
        flex
        flex-col
      "
    >
      <div className="px-6 pb-4 pt-7 flex flex-col shrink-0">
        <div className="flex-col">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Lumen</p>
          <h1 className="mt-1.5 font-serif text-[27px] font-medium tracking-[-0.025em] text-white">Directory</h1>
        </div>
        <label className="mt-6 flex h-11 items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 text-slate-500 focus-within:border-violet-300/40 focus-within:ring-2 focus-within:ring-violet-400/10">
          <HiSearch className="size-4" />
          <input
            ref={searchRef}
            suppressHydrationWarning
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            placeholder="Search people"
          />
          <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">⌘K</span>
        </label>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredItems.map((item) => (
          <UserBox
            key={item.id}
            data={item}
          />
        ))}
        {filteredItems.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-500">
            {query.trim() ? 'No people match your search.' : 'No other users yet.'}
          </p>
        )}
      </div>
    </aside>
  );
}

export default UserList;
