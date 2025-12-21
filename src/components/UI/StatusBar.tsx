import { useState, useEffect } from 'react';

let setStatusGlobal: (msg: string | null) => void = () => {};

export const showStatus = (msg: string) => {
  setStatusGlobal(msg);
};

export const hideStatus = () => {
  setStatusGlobal(null);
};

export default function StatusBar() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setStatusGlobal = setStatus;
  }, []);

  if (!status) return null;

  return (
    <div 
      id="status-bar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm animate-bounce border-2 border-white/30 backdrop-blur-sm btn-primary-shine btn-shine"
    >
      <div className="flex items-center gap-2">
        <span className="animate-pulse">📍</span>
        {status}
      </div>
    </div>
  );
}
