import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const isNeon =
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require');
    const isProduction = process.env.NODE_ENV === 'production';

    pool = new Pool({
      connectionString,
      max: isProduction ? 10 : 20,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: isProduction || isNeon ? { rejectUnauthorized: false } : undefined,
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R>> {
  const client = await getPool().connect();
  try {
    const result = await client.query<R>(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}
