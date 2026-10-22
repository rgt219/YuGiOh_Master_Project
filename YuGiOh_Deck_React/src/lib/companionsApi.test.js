import { fetchCompanions } from './companionApi';
import { vi } from 'vitest';

it('requests the card companions URL and returns the body', async () => {
    const body = { cardId: '86331741', deckCount: 58, companions: [], sideCompanions: [] };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => body });

    const result = await fetchCompanions('https://api.test/api', '86331741', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith('https://api.test/api/cards/86331741/companions', expect.anything());
    expect(result).toEqual(body);
});

it('throws when the server answers with an error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400 });

    await expect(fetchCompanions('https://api.test/api', 'abc', { fetchImpl })).rejects.toThrow('400');
});