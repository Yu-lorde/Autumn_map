import { useEffect } from 'react';
import { isIOSDevice, openNavigation, type NavigationMode, type MapProvider } from '../../utils/systemNavigation';
import { agentLog } from '../../utils/agentLog';

export interface NavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dest: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
  onInternalNavigate?: (dest: { lat: number; lng: number; name?: string }, plantInfo?: { plantId: string; locationIndex: number }) => void;
  navInternal?: { plantId: string; locationIndex: number } | null;
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

export default function NavigationSheet({ isOpen, onClose, dest, mode = 'walk', onInternalNavigate, navInternal, variant = 'mobile' }: NavigationSheetProps) {
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

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F',location:'NavigationSheet.tsx:render(open)',message:'navigation sheet rendered (open)',data:{variant,hasOnInternalNavigate:!!onInternalNavigate,hasNavInternal:!!navInternal,destHasName:!!dest?.name,destLatFinite:Number.isFinite(dest?.lat),destLngFinite:Number.isFinite(dest?.lng)},timestamp:Date.now()})}).catch(()=>{});
  agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F',location:'NavigationSheet.tsx:render(open):beacon',message:'navigation sheet rendered (open)',data:{variant,hasOnInternalNavigate:!!onInternalNavigate,hasNavInternal:!!navInternal,destHasName:!!dest?.name,destLatFinite:Number.isFinite(dest?.lat),destLngFinite:Number.isFinite(dest?.lng)},timestamp:Date.now()});
  // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'NavigationSheet.tsx:handleInternal',message:'internal navigation clicked',data:{hasOnInternalNavigate:!!onInternalNavigate,hasNavInternal:!!navInternal,variant,destHasName:!!dest?.name,destLatFinite:Number.isFinite(dest?.lat),destLngFinite:Number.isFinite(dest?.lng)},timestamp:Date.now()})}).catch(()=>{});
    agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'NavigationSheet.tsx:handleInternal:beacon',message:'internal navigation clicked',data:{hasOnInternalNavigate:!!onInternalNavigate,hasNavInternal:!!navInternal,variant,destHasName:!!dest?.name,destLatFinite:Number.isFinite(dest?.lat),destLngFinite:Number.isFinite(dest?.lng)},timestamp:Date.now()});
    // #endregion
    // 修复：传入当前目的地的副本，确保即便状态清空也能执行导航
    onInternalNavigate({ ...dest }, navInternal ? { ...navInternal } : undefined);
    onClose();
  };

  // 电脑端：居中对话框
  if (variant === 'desktop') {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center">
        {/* overlay - 全屏增强毛玻璃遮罩 */}
        <button
          type="button"
          aria-label="关闭"
          className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"
          onClick={onClose}
        />

        {/* 居中对话框 */}
        <div 
          className="relative w-[400px] max-w-[90vw] bg-white/90 backdrop-blur-2xl shadow-2xl rounded-3xl border border-orange-200/40 overflow-hidden"
          style={{
            animation: 'dialogAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* 头部 */}
          <div className="px-6 py-5 border-b border-orange-100/50 bg-orange-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-orange-800">选择导航方式</h3>
                <p className="text-sm text-orange-600/70 mt-1">
                  前往：{dest.name || '目的地'}
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
          <div className="p-6 space-y-4">
            {/* 本项目导航 - 突出显示 */}
            {onInternalNavigate && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest px-1">推荐方式</p>
                <DesktopNavButton
                  label="用本项目导航 (推荐)"
                  onClick={handleInternal}
                  icon={MapIcons.internal}
                  primary
                />
              </div>
            )}

            {/* 外部地图 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">外部地图应用</p>
              <div className="grid grid-cols-1 gap-2">
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
          <div className="px-6 py-4 bg-orange-50/30 border-t border-orange-100/30">
            <p className="text-xs text-orange-400/80 text-center">
              点击外部或按 ESC 键即可关闭
            </p>
          </div>
        </div>

        <style>{`
          @keyframes dialogAppear {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // 移动端：底部抽屉
  return (
    <div className="fixed inset-0 z-[3000]">
      {/* overlay - 全屏毛玻璃遮罩 */}
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="absolute left-0 right-0 bottom-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))] animate-slide-up">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/60">
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
