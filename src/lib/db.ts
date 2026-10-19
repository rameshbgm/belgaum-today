import mysql from 'mysql2/promise';
import { assertPreviewQueryAllowed, assertPreviewWritable, isReadOnlyPreview } from './preview';

// Keep a single pool across development module reloads. A small review pool
// shares the live database without accumulating idle Hostinger connections.
const databaseGlobal = globalThis as unknown as { belgaumTodayPool?: mysql.Pool };
const pool = databaseGlobal.belgaumTodayPool || mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'belgaum_today',
    waitForConnections: true,
    connectionLimit: isReadOnlyPreview() ? 5 : 50,
    maxIdle: isReadOnlyPreview() ? 2 : 10,
    idleTimeout: 30000,
    queueLimit: 0, // Unlimited queue
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000, // 10 second connection timeout
});
if (process.env.NODE_ENV === 'development') databaseGlobal.belgaumTodayPool = pool;

// Detailed error logger for DB operations
function logDbError(operation: string, sql: string, error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message || 'Unknown error';
    const isConnectionError = message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('ENOTFOUND');

    console.error(`[DB ${operation} Error]`, {
        message,
        sql: sql.substring(0, 200),
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || '3306',
        database: process.env.DATABASE_NAME || 'belgaum_today',
        isConnectionError,
        timestamp: new Date().toISOString(),
    });
}

// mysql2's accepted bind-parameter values (newer versions reject unknown[])
type SqlParam = string | number | boolean | null | Date | Buffer;

// Query helper with automatic connection handling
export async function query<T = unknown>(
    sql: string,
    params?: unknown[]
): Promise<T> {
    assertPreviewQueryAllowed(sql);
    try {
        let rows;
        try {
            [rows] = await pool.execute(sql, params as SqlParam[] | undefined);
        } catch (error) {
            const code = (error as { code?: string })?.code;
            const staleRead = /^\s*SELECT\b/i.test(sql) && ['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT'].includes(code || '');
            if (!staleRead) throw error;
            // Only a read is safe to repeat after a dropped idle connection.
            [rows] = await pool.execute(sql, params as SqlParam[] | undefined);
        }
        return rows as T;
    } catch (error) {
        logDbError('QUERY', sql, error);
        throw error;
    }
}

// Get a single row
export async function queryOne<T = unknown>(
    sql: string,
    params?: unknown[]
): Promise<T | null> {
    try {
        const rows = await query<T[]>(sql, params);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        logDbError('QUERY_ONE', sql, error);
        throw error;
    }
}

// Execute insert and return insertId
export async function insert(
    sql: string,
    params?: unknown[]
): Promise<number> {
    assertPreviewWritable();
    try {
        const [result] = await pool.execute(sql, params as SqlParam[] | undefined);
        return (result as mysql.ResultSetHeader).insertId;
    } catch (error) {
        logDbError('INSERT', sql, error);
        throw error;
    }
}

// Execute update/delete and return affected rows
export async function execute(
    sql: string,
    params?: unknown[]
): Promise<number> {
    assertPreviewWritable();
    try {
        const [result] = await pool.execute(sql, params as SqlParam[] | undefined);
        return (result as mysql.ResultSetHeader).affectedRows;
    } catch (error) {
        logDbError('EXECUTE', sql, error);
        throw error;
    }
}

// Transaction helper
export async function transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
    assertPreviewWritable();
    let connection: mysql.PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch { /* ignore rollback error */ }
        }
        logDbError('TRANSACTION', 'transaction callback', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Health check
export async function checkConnection(): Promise<boolean> {
    try {
        await pool.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

export default pool;
