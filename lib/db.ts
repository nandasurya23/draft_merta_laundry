import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      max: 20,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
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
