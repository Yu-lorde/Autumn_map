import { useEffect } from 'react';
import { isIOSDevice, openNavigation, type NavigationMode, type MapProvider } from '../../utils/systemNavigation';

export interface NavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dest: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
  onInternalNavigate?: () => void;
}

function SheetButton(props: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      className={`w-full py-4 text-center text-lg font-semibold active:bg-black/5 transition-colors ${
        props.danger ? 'text-orange-600' : 'text-slate-900'
      }`}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

export default function NavigationSheet({ isOpen, onClose, dest, mode = 'walk', onInternalNavigate }: NavigationSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    // 打开时锁滚动
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const iOS = isIOSDevice();
  const providers: Array<{ label: string; provider: MapProvider }> = iOS
    ? [
        { label: '腾讯地图', provider: 'tencent' },
        { label: 'Apple 地图', provider: 'apple' },
        { label: '用设备打开', provider: 'device' }
      ]
    : [
        { label: '腾讯地图', provider: 'tencent' },
        { label: '高德地图', provider: 'amap' },
        { label: '百度地图', provider: 'baidu' },
        { label: '用设备打开', provider: 'device' }
      ];

  const handlePick = (provider: MapProvider) => {
    onClose();
    // 延迟一帧，避免关闭动画/点击穿透影响跳转
    requestAnimationFrame(() => {
      openNavigation(provider, { dest, mode });
    });
  };

  const handleInternal = () => {
    if (!onInternalNavigate) return;
    onClose();
    requestAnimationFrame(() => {
      onInternalNavigate();
    });
  };

  return (
    <div className="fixed inset-0 z-[3000]">
      {/* overlay */}
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="absolute left-0 right-0 bottom-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/60">
          <div className="py-2">
            <div className="mx-auto my-2 h-1 w-12 rounded-full bg-slate-300/70" />
            <div className="px-4 pb-2 text-center text-sm text-slate-500">
              选择地图导航
            </div>
          </div>

          <div className="divide-y divide-slate-200/70">
            {onInternalNavigate && (
              <SheetButton label="用本项目导航" onClick={handleInternal} />
            )}
            {providers.map((p) => (
              <SheetButton key={p.provider} label={p.label} onClick={() => handlePick(p.provider)} />
            ))}
          </div>
        </div>

        <div className="mt-3 mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/60">
          <SheetButton label="取消" onClick={onClose} danger />
        </div>
      </div>
    </div>
  );
}

