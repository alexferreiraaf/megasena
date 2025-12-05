'use server';

import type { LotteryResult } from '@/lib/types';

// Usando um proxy para evitar problemas de CORS/bloqueio da API da Caixa em produção
const MEGA_SENA_API_URL = 'https://loteriascaixa-api.herokuapp.com/api/megasena';

async function fetchFromCaixaAPI(path: string = ''): Promise<any> {
    const fullApiUrl = `${MEGA_SENA_API_URL}${path}`;
    try {
        // A Vercel faz cache de requisições fetch por padrão. `no-cache` garante que sempre teremos os dados mais recentes.
        const apiResponse = await fetch(fullApiUrl, { cache: 'no-store' });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(`Proxy API Error! Status: ${apiResponse.status}, URL: ${fullApiUrl}, Body: ${errorBody}`);
            throw new Error('Falha ao buscar dados do proxy da Caixa.');
        }
        
        // A API de proxy retorna uma lista para o endpoint base, então precisamos pegar o primeiro item.
        const data = await apiResponse.json();
        if (path === '' && Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        return data;

    } catch (error) {
        console.error(`Failed to fetch from Proxy API: ${fullApiUrl}`, error);
        throw new Error('Ocorreu um erro ao se comunicar com a API de loterias.');
    }
}


async function fetchContest(contestNumber: number): Promise<LotteryResult | null> {
  try {
    const data = await fetchFromCaixaAPI(`/${contestNumber}`);
    return data as LotteryResult;
  } catch (error) {
    console.error(`Error fetching individual contest ${contestNumber}:`, error);
    return null;
  }
}

export async function fetchLastTenResults(): Promise<{ data: LotteryResult[]; error: string | null }> {
  const results: LotteryResult[] = [];
  try {
    // A API de proxy retorna os resultados em um array, vamos buscar a lista toda de uma vez.
    const allResults = await fetch(MEGA_SENA_API_URL, { cache: 'no-store' }).then(res => res.json());

    if (!allResults || !Array.isArray(allResults) || allResults.length === 0) {
        throw new Error('Não foi possível obter os resultados da API de proxy.');
    }

    // Pegamos os 10 últimos da lista, que já vem ordenada
    const lastTen = allResults.slice(0, 10);
    
    return { data: lastTen, error: null };

  } catch (error) {
    console.error('Error in fetchLastTenResults:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return { data: [], error: errorMessage };
  }
}

export async function fetchSpecificContest(contestNumber: number): Promise<{ data: LotteryResult | null; error: string | null }> {
    if (!contestNumber || contestNumber <= 0) {
        return { data: null, error: "Número do concurso inválido." };
    }
    try {
        const result = await fetchContest(contestNumber);
        if (!result) {
            return { data: null, error: `Concurso ${contestNumber} não encontrado ou a API falhou.` };
        }
        return { data: result, error: null };
    } catch (error) {
        console.error(`Error fetching contest ${contestNumber}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { data: null, error: errorMessage };
    }
}
