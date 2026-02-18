import mysql from 'mysql2/promise';

// Connection pool configuration for Hostinger shared hosting
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'belgaum_today',
    waitForConnections: true,
    connectionLimit: 50, // Increased from 10 to handle concurrent requests
    maxIdle: 10, // Maximum idle connections
    idleTimeout: 60000, // Close idle connections after 60 seconds
    queueLimit: 0, // Unlimited queue
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000, // 10 second connection timeout
});

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

// Query helper with automatic connection handling
export async function query<T = unknown>(
    sql: string,
    params?: unknown[]
): Promise<T> {
    try {
        const [rows] = await pool.execute(sql, params);
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
    try {
        const [result] = await pool.execute(sql, params);
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
    try {
        const [result] = await pool.execute(sql, params);
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
