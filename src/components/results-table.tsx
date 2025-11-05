"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LotteryResult } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function MegaSenaBall({ number }: { number: string }) {
  return (
    <div className="flex items-center justify-center size-8 rounded-full text-xs font-semibold shadow-md flex-shrink-0 bg-gradient-to-br from-green-500 to-green-700 text-white">
      {number}
    </div>
  );
}

interface ResultsTableProps {
  results: LotteryResult[];
  isLoading: boolean;
}

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
    if (isLoading) {
        return (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="size-8 rounded-full" />)}
                  </div>
                  <Skeleton className="h-8 flex-1" />
                </div>
              ))}
            </div>
          </div>
        );
    }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Concurso</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Dezenas</TableHead>
            <TableHead>Ganhadores (Sena)</TableHead>
            <TableHead>Prêmio</TableHead>
            <TableHead>Acumulado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length > 0 ? (
            results.map((result, index) => {
              const rateio = result.listaRateioPremio || [];
              const dezenas = result.listaDezenas || [];
              const premioSena = rateio.find(p => p.descricaoFaixa.includes('6 acertos'));
              const premioValor = result.indicadorAcumulo 
                ? `Acumulado` 
                : formatCurrency(premioSena?.valorPremio);
                
              return (
                <TableRow key={result.numero} className={cn(index % 2 === 0 ? "bg-background" : "bg-muted/50")}>
                  <TableCell className="font-bold">{result.numero}</TableCell>
                  <TableCell>{result.dataApuracao}</TableCell>
                  <TableCell>
                    <div className="flex flex-nowrap gap-2">
                      {dezenas.map((dezena) => (
                        <MegaSenaBall key={dezena} number={dezena} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className={cn("font-medium", result.indicadorAcumulo ? 'text-amber-600 dark:text-amber-500' : 'text-accent')}>
                    {result.indicadorAcumulo ? 'Acumulou' : `${premioSena?.numeroDeGanhadores || 0} Ganhador(es)`}
                  </TableCell>
                  <TableCell className="font-semibold">{premioValor}</TableCell>
                  <TableCell>{formatCurrency(result.valorAcumulado)}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
