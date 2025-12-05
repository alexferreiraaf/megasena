'use server';

import type { LotteryResult } from '@/lib/types';

// This function now fetches data from our own API route,
// which acts as a reliable proxy to the Caixa API.
async function fetchFromInternalAPI(path: string = ''): Promise<any> {
    // We need to construct the absolute URL to our API route.
    // VERCEL_URL is a system environment variable provided by Vercel.
    // For local development, we default to localhost.
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:9002';
      
    const url = `${baseUrl}/api/results${path}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Internal API Error! Status: ${response.status}, URL: ${url}, Body: ${errorBody}`);
            throw new Error('Falha na comunicação com o servidor interno.');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch from internal API: ${url}`, error);
        throw error;
    }
}


async function fetchContest(contestNumber: number): Promise<LotteryResult | null> {
  try {
    // Fetch individual contests through our internal API route
    const data = await fetchFromInternalAPI(`/${contestNumber}`);
    return data as LotteryResult;
  } catch (error) {
    // The error is already logged in fetchFromInternalAPI,
    // so we just return null to signal a failure for this specific contest.
    return null;
  }
}

export async function fetchLastTenResults(): Promise<{ data: LotteryResult[]; error: string | null }> {
  const results: LotteryResult[] = [];
  try {
    // First, fetch the latest contest to get its number
    const latestContestData = await fetchFromInternalAPI() as LotteryResult;
    if (!latestContestData || !latestContestData.numero) {
        throw new Error('Não foi possível obter o número do último concurso.');
    }
    const lastContestNumber = latestContestData.numero;

    // Then, create promises to fetch the last 10 contests
    const promises: Promise<LotteryResult | null>[] = [];
    for (let i = 0; i < 10; i++) {
      const contestNumber = lastContestNumber - i;
      if (contestNumber > 0) {
        promises.push(fetchContest(contestNumber));
      }
    }

    const settledResults = await Promise.all(promises);

    settledResults.forEach(result => {
      if (result) {
        results.push(result);
      }
    });

    if (results.length === 0) {
      throw new Error("Nenhum resultado pôde ser buscado. A API da Caixa pode estar com problemas.");
    }
    
    // Sort results from newest to oldest
    results.sort((a, b) => b.numero - a.numero);

    return { data: results, error: null };
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
            return { data: null, error: `Concurso ${contestNumber} não encontrado.` };
        }
        return { data: result, error: null };
    } catch (error) {
        console.error(`Error fetching contest ${contestNumber}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { data: null, error: errorMessage };
    }
}
