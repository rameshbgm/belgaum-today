import mysql from 'mysql2/promise';

// Connection pool configuration for Hostinger shared hosting
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'belgaum_today',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Query helper with automatic connection handling
export async function query<T = unknown>(
    sql: string,
    params?: unknown[]
): Promise<T> {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
}

// Get a single row
export async function queryOne<T = unknown>(
    sql: string,
    params?: unknown[]
): Promise<T | null> {
    const rows = await query<T[]>(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

// Execute insert and return insertId
export async function insert(
    sql: string,
    params?: unknown[]
): Promise<number> {
    const [result] = await pool.execute(sql, params);
    return (result as mysql.ResultSetHeader).insertId;
}

// Execute update/delete and return affected rows
export async function execute(
    sql: string,
    params?: unknown[]
): Promise<number> {
    const [result] = await pool.execute(sql, params);
    return (result as mysql.ResultSetHeader).affectedRows;
}

// Transaction helper
export async function transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
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
