'use client';

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const GlobalError: React.FC<ErrorProps> = ({ error, reset }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-[#070b14] px-6 text-center text-slate-200">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="max-w-sm text-sm text-slate-400">
        An unexpected error occurred. You can try again, or refresh the page.
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

export default GlobalError;
