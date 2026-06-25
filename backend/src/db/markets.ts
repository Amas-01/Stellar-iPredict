import { PoolClient } from 'pg';

export interface Market {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface UpsertMarketResult {
    id: number;
    title: string;
    description: string;
    status: string;
    inserted: boolean;
}

/**
 * Upserts a market using INSERT ... ON CONFLICT (id) DO UPDATE
 * 
 * @param client PostgreSQL client instance
 * @param market Market data to upsert
 * @returns Strongly typed result of the operation
 */
export async function upsertMarket(client: PoolClient, market: Market): Promise<UpsertMarketResult> {
    const query = `
        INSERT INTO markets (id, title, description, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, title, description, status, (xmax = 0) AS inserted;
    `;
    
    const values = [market.id, market.title, market.description, market.status];
    
    const result = await client.query(query, values);
    
    return result.rows[0] as UpsertMarketResult;
}
