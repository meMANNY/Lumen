'use client';

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ConversationsError: React.FC<ErrorProps> = ({ error, reset }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#070b14] px-6 text-center text-slate-200">
      <p className="text-lg font-semibold">Couldn&apos;t load this conversation</p>
      <p className="max-w-sm text-sm text-slate-400">
        Something went wrong while loading your messages. Try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-violet-300 px-4 py-2 text-sm font-medium text-violet-950 transition hover:bg-violet-200"
      >
        Try again
      </button>
    </div>
  );
}

export default ConversationsError;
