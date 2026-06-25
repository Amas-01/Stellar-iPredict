import { PoolClient } from 'pg';
import { upsertMarket } from './markets';

describe('Market DB Queries', () => {
    let mockClient: jest.Mocked<PoolClient>;

    beforeEach(() => {
        mockClient = {
            query: jest.fn()
        } as any;
    });

    it('should successfully insert a new market', async () => {
        const mockResult = {
            rows: [
                { id: 1, title: 'Test Market', description: 'Desc', status: 'open', inserted: true }
            ]
        };
        (mockClient.query as jest.Mock).mockResolvedValue(mockResult);

        const market = { id: 1, title: 'Test Market', description: 'Desc', status: 'open' };
        const result = await upsertMarket(mockClient, market);

        expect(mockClient.query).toHaveBeenCalledTimes(1);
        expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [1, 'Test Market', 'Desc', 'open']);
        expect(result).toEqual(mockResult.rows[0]);
    });

    it('should update an existing market through ON CONFLICT', async () => {
        const mockResult = {
            rows: [
                { id: 1, title: 'Updated Market', description: 'Desc', status: 'open', inserted: false }
            ]
        };
        (mockClient.query as jest.Mock).mockResolvedValue(mockResult);

        const market = { id: 1, title: 'Updated Market', description: 'Desc', status: 'open' };
        const result = await upsertMarket(mockClient, market);

        expect(mockClient.query).toHaveBeenCalledTimes(1);
        expect(result.inserted).toBe(false);
    });
});
