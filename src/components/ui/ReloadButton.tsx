'use client';
export function ReloadButton() {
    return <button type="button" className="text-action mt-5" onClick={() => window.location.reload()}>Reload the briefing</button>;
}
