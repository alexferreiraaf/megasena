import { NextResponse } from 'next/server';

const MEGA_SENA_API_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';

// This tells Next.js to not cache results of this route.
export const dynamic = 'force-dynamic';

// Handles GET requests to /api/results/[contest]
export async function GET(
  request: Request,
  { params }: { params: { contest: string } }
) {
  const contestNumber = params.contest;

  if (!contestNumber || isNaN(Number(contestNumber))) {
    return NextResponse.json({ message: 'Número do concurso inválido.' }, { status: 400 });
  }
  
  const fullApiUrl = `${MEGA_SENA_API_URL}/${contestNumber}`;

  try {
    const apiResponse = await fetch(fullApiUrl, {
      // Revalidate every 5 minutes
      next: { revalidate: 300 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!apiResponse.ok) {
      // If the API returns an error, we forward it to our client
      return NextResponse.json(
        { message: `Erro ao buscar dados da Caixa: ${apiResponse.statusText}` },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    
    // Return the successful response to our client
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Erro ao fazer proxy para ${fullApiUrl}:`, error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao buscar os resultados.' },
      { status: 500 }
    );
  }
}
