const ENDPOINT =
  'http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281';

export type AgentLogPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

// 使用 sendBeacon 优先，避免 CORS 预检导致日志发不出去
export function agentLog(payload: AgentLogPayload) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
      return;
    }
    // 退化方案：尽量减少预检/阻塞（响应不可读也没关系，我们只需要“请求被收到”）
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
  } catch {
    // ignore
  }
}

