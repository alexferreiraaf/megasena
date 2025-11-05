'use server';

import type { LotteryResult } from '@/lib/types';

const MEGA_SENA_API_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';

async function fetchContest(contestNumber: number): Promise<LotteryResult | null> {
  try {
    const response = await fetch(`${MEGA_SENA_API_URL}/${contestNumber}`, {
      // Revalidate frequently to get fresh data, but still cache to avoid hitting rate limits
      next: { revalidate: 300 } 
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      console.error(`HTTP Error! Status: ${response.status} for contest ${contestNumber}`);
      return null;
    }
    const data = await response.json();
    return data as LotteryResult;
  } catch (error) {
    console.error(`Failed to fetch contest ${contestNumber}:`, error);
    return null;
  }
}

export async function fetchLastTenResults(): Promise<{ data: LotteryResult[]; error: string | null }> {
  const results: LotteryResult[] = [];
  try {
    const latestContestResponse = await fetch(MEGA_SENA_API_URL, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!latestContestResponse.ok) {
      throw new Error('Falha ao buscar o último concurso. A API pode estar indisponível.');
    }

    const latestContestData = await latestContestResponse.json() as LotteryResult;
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
      throw new Error("Nenhum resultado pôde ser buscado. A API pode estar com problemas.");
    }
    
    results.sort((a, b) => b.numero - a.numero);

    return { data: results, error: null };
  } catch (error) {
    console.error('Error in fetchLastTenResults:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    
    if (errorMessage.includes('fetch')) {
      return { data: [], error: "ERRO DE CONEXÃO (CORS ou Rede). Verifique o aviso no final da página para mais detalhes." };
    }
    return { data: [], error: errorMessage };
  }
}
