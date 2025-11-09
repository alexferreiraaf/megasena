'use server';
/**
 * @fileOverview Flow para sugerir números da Mega-Sena.
 *
 * - suggestNumbers - Uma função que sugere 6 dezenas com base em resultados anteriores.
 * - SuggestNumbersInput - O tipo de entrada para a função suggestNumbers.
 * - SuggestNumbersOutput - O tipo de retorno para a função suggestNumbers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestNumbersInputSchema = z.object({
  history: z.array(z.object({
    numero: z.number(),
    listaDezenas: z.array(z.string()),
  })).describe("Uma lista dos últimos resultados da loteria."),
});
export type SuggestNumbersInput = z.infer<typeof SuggestNumbersInputSchema>;

const SuggestNumbersOutputSchema = z.object({
  suggestedNumbers: z.array(z.string()).length(6).describe("Uma lista de 6 dezenas sugeridas."),
  explanation: z.string().describe("Uma breve explicação sobre a estratégia usada para sugerir os números."),
});
export type SuggestNumbersOutput = z.infer<typeof SuggestNumbersOutputSchema>;


export async function suggestNumbers(input: SuggestNumbersInput): Promise<SuggestNumbersOutput> {
  return suggestNumbersFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestNumbersPrompt',
    input: { schema: SuggestNumbersInputSchema },
    output: { schema: SuggestNumbersOutputSchema },
    prompt: `Você é um especialista em análise de dados de loteria. Analise o histórico de resultados da Mega-Sena a seguir e sugira 6 dezenas para o próximo concurso. Forneça também uma breve explicação sobre a lógica ou padrão que você identificou para chegar a essa sugestão.

Histórico:
{{#each history}}
- Concurso {{numero}}: {{#each listaDezenas}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}
`,
});

const suggestNumbersFlow = ai.defineFlow(
  {
    name: 'suggestNumbersFlow',
    inputSchema: SuggestNumbersInputSchema,
    outputSchema: SuggestNumbersOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
