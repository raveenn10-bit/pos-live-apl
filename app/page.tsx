'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/src/App'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center bg-[#000000] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide text-neutral-400">Loading AppleVision POS...</span>
      </div>
    </div>
  ),
});

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center bg-[#000000] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide text-neutral-400">AppleVision Store Galle</span>
        </div>
      </div>
    );
  }

  return <App />;
}
