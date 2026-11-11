'use client';

/**
 * 확인 창(ask)과 토스트(toast)를 한 번에 제공하는 훅. 쓰는 쪽은 `node`를 화면 어딘가에 그려 두면 된다.
 *
 * - ask: "정말 지울까요?" 같은 확인. danger=true면 확인 버튼이 빨강. Esc나 바깥을 누르면 취소.
 * - toast: 5초 뒤 사라지는 알림. 버튼(예: 되돌리기)을 달 수 있다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface Dialog {
  title: string;
  text: string;
  ok: string;
  danger: boolean;
  cb: () => void;
}
interface ToastState {
  text: string;
  btn?: string;
  cb?: () => void;
}

export interface Overlays {
  ask: (title: string, text: string, ok: string, cb: () => void, danger?: boolean) => void;
  toast: (text: string, btn?: string, cb?: () => void) => void;
  node: React.ReactNode;
}

export function useOverlays(): Overlays {
  const [dlg, setDlg] = useState<Dialog | null>(null);
  const [toastState, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Overlays['ask']>((title, text, ok, cb, danger = false) => setDlg({ title, text, ok, danger, cb }), []);
  const toast = useCallback<Overlays['toast']>((text, btn, cb) => {
    setToast({ text, btn, cb });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // 확인 창이 뜨면 확인 버튼에 포커스, Esc로 닫기
  useEffect(() => {
    if (!dlg) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDlg(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dlg]);

  const node = (
    <>
      {dlg && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setDlg(null)}>
          <div className="box" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
            <h3 id="dlg-title">{dlg.title}</h3>
            <p>{dlg.text}</p>
            <div className="mact">
              <button type="button" className="btn" onClick={() => setDlg(null)}>
                취소
              </button>
              <button
                ref={okRef}
                type="button"
                className={`btn ${dlg.danger ? 'danger' : 'pri'}`}
                onClick={() => {
                  const f = dlg.cb;
                  setDlg(null);
                  f();
                }}
              >
                {dlg.ok}
              </button>
            </div>
          </div>
        </div>
      )}
      {toastState && (
        <div className="toast" role="status">
          <span>{toastState.text}</span>
          {toastState.btn && (
            <button
              type="button"
              onClick={() => {
                const f = toastState.cb;
                setToast(null);
                f?.();
              }}
            >
              {toastState.btn}
            </button>
          )}
        </div>
      )}
    </>
  );

  return { ask, toast, node };
}
