'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';

const PreviewContext = createContext(false);
export function useReadOnlyPreview() { return useContext(PreviewContext); }

export function PreviewProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
    return <PreviewContext.Provider value={enabled}>
        {children}
        {enabled && <div className="preview-notice" role="status" title="Live content. Editing, tracking, emails and background jobs are disabled.">
            <LockKeyhole size={12} aria-hidden="true" /> Read-only preview
        </div>}
    </PreviewContext.Provider>;
}
