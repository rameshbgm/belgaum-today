'use client';
import { useEffect, useRef, type ReactNode } from 'react';

/** Native modal focus containment and Escape handling for editor detail panels. */
export function DetailPanel({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
    return <dialog ref={dialog} aria-label={label} onCancel={onClose} className="detail-panel" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
        {children}
    </dialog>;
}
