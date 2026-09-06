import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

declare global {
  var __mertaPostgresPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__mertaPostgresPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const isNeon =
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require');
    const isProduction = process.env.NODE_ENV === 'production';

    const newPool = new Pool({
      connectionString,
      max: isProduction ? 10 : 20,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: isProduction || isNeon ? { rejectUnauthorized: false } : undefined,
    });

    newPool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });

    globalThis.__mertaPostgresPool = newPool;
  }

  return globalThis.__mertaPostgresPool;
}

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R>> {
  return getPool().query<R>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}
