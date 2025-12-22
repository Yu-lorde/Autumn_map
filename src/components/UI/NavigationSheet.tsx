import { useEffect } from 'react';
import { isIOSDevice, openNavigation, type NavigationMode, type MapProvider } from '../../utils/systemNavigation';

export interface NavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dest: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
  onInternalNavigate?: () => void;
  variant?: 'desktop' | 'mobile';
}

// 移动端底部抽屉按钮
function MobileSheetButton(props: { label: string; onClick: () => void; danger?: boolean }) {
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

// 电脑端侧边栏按钮
function DesktopNavButton(props: { 
  label: string; 
  onClick: () => void; 
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
        props.primary
          ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-500'
          : 'bg-white/80 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-orange-100 hover:border-orange-200'
      }`}
      onClick={props.onClick}
    >
      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20">
        {props.icon}
      </span>
      <span className="font-medium">{props.label}</span>
    </button>
  );
}

// 地图图标组件
const MapIcons = {
  internal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
  tencent: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="#12B7F5" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">腾</text>
    </svg>
  ),
  amap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="#1677FF" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">高</text>
    </svg>
  ),
  baidu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="#3385FF" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">百</text>
    </svg>
  ),
  apple: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="#333" />
      <path d="M15.5 8.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-7 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm3.5 8c-2.33 0-4.32-1.45-5.12-3.5h1.67c.69 1.19 1.97 2 3.45 2s2.76-.81 3.45-2h1.67c-.8 2.05-2.79 3.5-5.12 3.5z" fill="white" />
    </svg>
  ),
  device: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
};

export default function NavigationSheet({ isOpen, onClose, dest, mode = 'walk', onInternalNavigate, variant = 'mobile' }: NavigationSheetProps) {
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
    // 移动端打开时锁滚动
    if (variant === 'mobile') {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, variant]);

  if (!isOpen) return null;

  const iOS = isIOSDevice();
  const providers: Array<{ label: string; provider: MapProvider; icon: React.ReactNode }> = iOS
    ? [
        { label: '腾讯地图', provider: 'tencent', icon: MapIcons.tencent },
        { label: 'Apple 地图', provider: 'apple', icon: MapIcons.apple },
        { label: '用设备打开', provider: 'device', icon: MapIcons.device }
      ]
    : [
        { label: '腾讯地图', provider: 'tencent', icon: MapIcons.tencent },
        { label: '高德地图', provider: 'amap', icon: MapIcons.amap },
        { label: '百度地图', provider: 'baidu', icon: MapIcons.baidu },
        { label: '用设备打开', provider: 'device', icon: MapIcons.device }
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

  // 电脑端：左侧滑出面板
  if (variant === 'desktop') {
    return (
      <div className="fixed inset-0 z-[3000]">
        {/* overlay - 半透明遮罩 */}
        <button
          type="button"
          aria-label="关闭"
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />

        {/* 左侧滑出面板 */}
        <div 
          className="absolute left-[380px] top-[60px] bottom-0 w-[320px] bg-gradient-to-br from-amber-50/98 to-orange-50/98 backdrop-blur-md shadow-2xl border-r border-orange-200/40 overflow-hidden animate-slide-in-left"
          style={{
            animation: 'slideInLeft 0.3s ease-out'
          }}
        >
          {/* 头部 */}
          <div className="px-6 py-5 border-b border-orange-200/50 bg-white/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-orange-800">选择导航方式</h3>
                <p className="text-sm text-orange-600/70 mt-0.5">
                  {dest.name || '目的地'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-orange-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* 导航选项 */}
          <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {/* 本项目导航 - 突出显示 */}
            {onInternalNavigate && (
              <div className="mb-4">
                <p className="text-xs font-medium text-orange-500 uppercase tracking-wide mb-2 px-1">推荐</p>
                <DesktopNavButton
                  label="用本项目导航"
                  onClick={handleInternal}
                  icon={MapIcons.internal}
                  primary
                />
              </div>
            )}

            {/* 外部地图 */}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 px-1">外部地图</p>
              <div className="space-y-2">
                {providers.map((p) => (
                  <DesktopNavButton
                    key={p.provider}
                    label={p.label}
                    onClick={() => handlePick(p.provider)}
                    icon={p.icon}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-amber-50/95 to-transparent">
            <p className="text-xs text-orange-400/80 text-center">
              按 ESC 或点击外部区域关闭
            </p>
          </div>
        </div>

        <style>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // 移动端：底部抽屉
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
              <MobileSheetButton label="用本项目导航" onClick={handleInternal} />
            )}
            {providers.map((p) => (
              <MobileSheetButton key={p.provider} label={p.label} onClick={() => handlePick(p.provider)} />
            ))}
          </div>
        </div>

        <div className="mt-3 mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/60">
          <MobileSheetButton label="取消" onClick={onClose} danger />
        </div>
      </div>
    </div>
  );
}

