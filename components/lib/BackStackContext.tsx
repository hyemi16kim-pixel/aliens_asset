"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

// ── 타입 ─────────────────────────────────────────────────────────────────────

type StackEntry = { id: number; closer: () => void };

type BackStackContextType = {
  push: (closer: () => void) => number;   // 스택에 추가, ID 반환
  remove: (id: number) => void;           // ID로 제거
  handleBack: () => boolean;              // 처리했으면 true, 아니면 false
};

// ── Context ───────────────────────────────────────────────────────────────────

export const BackStackContext = createContext<BackStackContextType>({
  push: () => 0,
  remove: () => {},
  handleBack: () => false,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function BackStackProvider({ children }: { children: React.ReactNode }) {
  const stackRef = useRef<StackEntry[]>([]);
  const nextId = useRef(0);

  const push = useCallback((closer: () => void): number => {
    const id = nextId.current++;
    stackRef.current.push({ id, closer });
    return id;
  }, []);

  const remove = useCallback((id: number) => {
    stackRef.current = stackRef.current.filter((e) => e.id !== id);
  }, []);

  const handleBack = useCallback((): boolean => {
    if (stackRef.current.length > 0) {
      const entry = stackRef.current.pop()!;
      entry.closer();
      return true;
    }
    return false;
  }, []);

  return (
    <BackStackContext.Provider value={{ push, remove, handleBack }}>
      {children}
    </BackStackContext.Provider>
  );
}

// ── 훅 ───────────────────────────────────────────────────────────────────────

export function useBackStack() {
  return useContext(BackStackContext);
}

/**
 * useModalBack
 * isOpen이 true가 되면 BackStack에 closer를 등록하고,
 * false가 되면(직접 닫든 뒤로가기로 닫든) 스택에서 제거합니다.
 *
 * 사용법:
 *   useModalBack(showModal, () => setShowModal(false));
 */
export function useModalBack(isOpen: boolean, closer: () => void) {
  const { push, remove } = useBackStack();
  const idRef = useRef<number | null>(null);
  // closer가 바뀌어도 항상 최신 버전을 사용하도록 ref로 관리
  const closerRef = useRef(closer);
  closerRef.current = closer;

  useEffect(() => {
    if (isOpen) {
      // 모달 열림 → 스택에 등록
      idRef.current = push(() => closerRef.current());
    } else {
      // 모달 닫힘 → 스택에서 제거 (이미 뒤로가기로 제거됐어도 안전하게 처리)
      if (idRef.current !== null) {
        remove(idRef.current);
        idRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (idRef.current !== null) {
        remove(idRef.current);
        idRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
