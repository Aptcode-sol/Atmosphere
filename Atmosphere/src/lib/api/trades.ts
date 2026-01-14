/**
 * Trades API functions
 */
import { request } from './core';

export async function fetchMarkets() {
    const data = await request('/api/trade/markets', {}, { method: 'GET' });
    return data.markets || [];
}

export async function fetchMyPortfolio() {
    const data = await request('/api/trade/portfolio', {}, { method: 'GET' });
    return data.portfolio || { items: [] };
}

export async function placeOrder(assetId: string, side: 'buy' | 'sell', quantity: number) {
    return request('/api/trade/order', { assetId, side, quantity }, { method: 'POST' });
}

export async function createTrade(tradeData: any) {
    return request('/api/trade/trades', tradeData, { method: 'POST' });
}

export async function getMyTrades() {
    const data = await request('/api/trade/trades/my', {}, { method: 'GET' });
    return data.trades || [];
}

export async function getTradesByUserId(userId: string) {
    const data = await request(`/api/trade/trades/user/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
    return data.trades || [];
}

export async function getAllTrades(limit = 20, skip = 0, filters = {}) {
    const data = await request('/api/trade/trades', { limit, skip, ...filters }, { method: 'GET' });
    return data.trades || [];
}

export async function getTrade(tradeId: string) {
    const data = await request(`/api/trade/trades/${encodeURIComponent(tradeId)}`, {}, { method: 'GET' });
    return data.trade || null;
}

export async function updateTrade(id: string, tradeData: any) {
    return request(`/api/trade/trades/${id}`, tradeData, { method: 'PUT' });
}

export async function deleteTrade(id: string) {
    return request(`/api/trade/trades/${id}`, {}, { method: 'DELETE' });
}

export async function incrementTradeViews(id: string) {
    return request(`/api/trade/trades/${id}/view`, {}, { method: 'POST' });
}

export async function toggleTradeSave(id: string, saved: boolean) {
    return request(`/api/trade/trades/${id}/save`, { saved }, { method: 'POST' });
}

export async function getSavedTrades(): Promise<{ savedTradeIds: string[]; trades: any[] }> {
    const data = await request('/api/trade/trades/saved', {}, { method: 'GET' });
    return { savedTradeIds: data.savedTradeIds || [], trades: data.trades || [] };
}

// Investor APIs
export async function fetchInvestors(params?: { limit?: number; skip?: number }) {
    const data = await request('/api/investor-details', params || {}, { method: 'GET' });
    return data.investors || [];
}

export async function getInvestorDetails(userId: string) {
    try {
        const data = await request(`/api/investor-details/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
        return data?.investorDetails || null;
    } catch { return null; }
}
