import { useState, useEffect, useRef } from 'react';

// 全局状态管理
let statusBarRef: ((text: string | null) => void) | null = null;

export function showStatus(text: string) {
  if (statusBarRef) {
    statusBarRef(text);
  }
}

export function hideStatus() {
  if (statusBarRef) {
    statusBarRef(null);
  }
}

export default function StatusBar() {
  const [statusText, setStatusText] = useState<string | null>(null);
  const statusBarRefRef = useRef<((text: string | null) => void) | null>(null);

  useEffect(() => {
    statusBarRefRef.current = setStatusText;
    statusBarRef = setStatusText;
    return () => {
      statusBarRef = null;
      statusBarRefRef.current = null;
    };
  }, []);

  if (!statusText) return null;

  return (
    <div 
      id="status-bar"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] bg-white/92 backdrop-blur-md px-5 py-2 rounded-full shadow-md text-sm border border-black/10"
    >
      {statusText}
    </div>
  );
}

