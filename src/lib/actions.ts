'use server';

import type { LotteryResult } from '@/lib/types';

const MEGA_SENA_API_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';

async function fetchFromCaixaAPI(path: string = ''): Promise<any> {
    const fullApiUrl = `${MEGA_SENA_API_URL}${path}`;
    try {
        const apiResponse = await fetch(fullApiUrl, {
            // Revalidate every 5 minutes
            next: { revalidate: 300 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(`Caixa API Error! Status: ${apiResponse.status}, URL: ${fullApiUrl}, Body: ${errorBody}`);
            throw new Error('Falha ao buscar dados da Caixa.');
        }
        return await apiResponse.json();
    } catch (error) {
        console.error(`Failed to fetch from Caixa API: ${fullApiUrl}`, error);
        // Re-throw a more generic error to the client
        if (error instanceof Error && error.message.includes('CORS')) {
          throw new Error('Erro de CORS. Execute em um ambiente de servidor (npm run dev) ou em produção.');
        }
        throw new Error('Ocorreu um erro ao se comunicar com a API da Caixa.');
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
    const latestContestData = await fetchFromCaixaAPI() as LotteryResult;
    if (!latestContestData || !latestContestData.numero) {
        throw new Error('Não foi possível obter o número do último concurso.');
    }
    const lastContestNumber = latestContestData.numero;

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
      return { data: [], error: "Nenhum resultado pôde ser buscado. A API da Caixa pode estar com problemas." };
    }
    
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
            return { data: null, error: `Concurso ${contestNumber} não encontrado ou a API falhou.` };
        }
        return { data: result, error: null };
    } catch (error) {
        console.error(`Error fetching contest ${contestNumber}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { data: null, error: errorMessage };
    }
}
