'use server';
/**
 * @fileOverview Flow para sugerir números da Mega-Sena.
 *
 * - suggestNumbers - Uma função que sugere 6 dezenas com base em resultados anteriores.
 * - SuggestNumbersInput - O tipo de entrada para a função suggestNumbers.
 * - SuggestNumbersOutput - O tipo de retorno para a função suggestNumbers.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
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

const suggestNumbersPrompt = ai.definePrompt({
    name: 'suggestNumbersPrompt',
    input: { schema: SuggestNumbersInputSchema },
    output: { schema: SuggestNumbersOutputSchema },
    prompt: `Você é um analista de dados experiente e especialista em padrões de loteria. Sua tarefa é analisar o histórico de resultados da Mega-Sena e fornecer uma sugestão de 6 dezenas para o próximo concurso.

Sua análise deve ser baseada puramente em dados estatísticos, como frequência de dezenas, dezenas "quentes" (mais sorteadas recentemente) e "frias" (menos sorteadas). Evite misticismo ou sorte.

Baseado na sua análise, forneça as 6 dezenas sugeridas e uma explicação clara e concisa sobre a metodologia estatística que você empregou para chegar a essa combinação.

Histórico dos últimos concursos:
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
    const { output } = await ai.generate({
        model: googleAI.model('gemini-1.5-pro-latest'),
        prompt: suggestNumbersPrompt,
        input: input,
    });
    return output!;
  }
);
