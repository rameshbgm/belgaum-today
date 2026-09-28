// Next.js loads this entry point; delegate only from the Node.js runtime.
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const scheduler = await import('./instrumentation.node');
        await scheduler.register();
    }
}
