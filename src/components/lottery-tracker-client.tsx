"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { fetchLastTenResults } from "@/lib/actions";
import type { LotteryResult } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { ResultsTable } from "@/components/results-table";
import { AlertCircle } from "lucide-react";

interface LotteryTrackerClientProps {
  initialResults: LotteryResult[];
  initialError: string | null;
}

export function LotteryTrackerClient({ initialResults, initialError }: LotteryTrackerClientProps) {
  const [results, setResults] = useState<LotteryResult[]>(initialResults);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [clientLastUpdate, setClientLastUpdate] = useState<Date | null>(null);
  const [status, setStatus] = useState("Pronto para consulta.");

  const [filterConcurso, setFilterConcurso] = useState("");
  const [filterData, setFilterData] = useState("");
  const [filterDezenas, setFilterDezenas] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (initialError) {
      setStatus(initialError);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: initialError,
      });
    } else if (initialResults.length > 0) {
      setStatus(`${initialResults.length} concursos carregados com sucesso.`);
      setLastUpdate(new Date());
    }
  }, [initialError, toast, initialResults.length]);
  
  useEffect(() => {
      // This effect runs only on the client after hydration
      if (initialResults.length > 0) {
          setLastUpdate(new Date());
      }
  }, [initialResults.length]);

  useEffect(() => {
      if (lastUpdate) {
        setClientLastUpdate(lastUpdate);
      }
  }, [lastUpdate]);

  const handleFetchResults = useCallback(() => {
    startTransition(async () => {
      setProgress(0);
      setStatus("Buscando os 10 últimos resultados...");
      
      const progressInterval = setInterval(() => {
          setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const { data, error } = await fetchLastTenResults();

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        setStatus(error);
        toast({
          variant: "destructive",
          title: "Erro na Atualização",
          description: error,
        });
        setResults([]);
      } else {
        setResults(data);
        setStatus(`${data.length} concursos carregados com sucesso.`);
        setLastUpdate(new Date());
      }

      setTimeout(() => setProgress(0), 1000);
    });
  }, [toast]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      handleFetchResults();
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [handleFetchResults]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    
    if (filterConcurso) {
      filtered = filtered.filter(r => String(r.numero).includes(filterConcurso));
    }
    if (filterData) {
      filtered = filtered.filter(r => r.dataApuracao.includes(filterData));
    }
    if (filterDezenas) {
      const dezenas = filterDezenas.split(/[, ]+/).map(d => d.trim().padStart(2, '0')).filter(Boolean);
      if (dezenas.length > 0) {
        filtered = filtered.filter(r => 
          dezenas.every(dezena => (r.listaDezenas || []).includes(dezena))
        );
      }
    }
    return filtered;
  }, [results, filterConcurso, filterData, filterDezenas]);

  return (
    <div className="w-full max-w-6xl relative">
      <Card className="shadow-lg">
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
          <ThemeToggleButton />
        </div>
        <CardHeader className="border-b pb-4 mb-6 sm:mb-8 pr-16 sm:pr-20">
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-foreground">
                <span className="text-accent">Mega-Sena</span> Últimos Resultados
            </CardTitle>
            <CardDescription className="text-sm pt-2">Status: {status}</CardDescription>
        </CardHeader>

        <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-center pb-4 mb-6 gap-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleFetchResults} disabled={isPending} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    {isPending ? "Atualizando..." : "Buscar Últimos 10 Resultados"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {clientLastUpdate ? `Última atualização: ${clientLastUpdate.toLocaleTimeString('pt-BR')}` : "Nenhuma atualização"}
              </p>
            </div>
            
            <div className="space-y-4 mb-8 p-4 border rounded-lg bg-secondary/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input type="number" placeholder="Pesquisar por Concurso" value={filterConcurso} onChange={e => setFilterConcurso(e.target.value)} disabled={isPending} />
                  <Input type="text" placeholder="Data (ex: 20/05)" value={filterData} onChange={e => setFilterData(e.target.value)} disabled={isPending} />
                  <Input type="text" placeholder="Dezenas (ex: 10,25)" value={filterDezenas} onChange={e => setFilterDezenas(e.target.value)} disabled={isPending} />
              </div>
            </div>

            {(isPending || progress > 0) && (
              <div className="mb-8 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Processando dados...</label>
                <Progress value={progress} className="w-full" />
              </div>
            )}
            
            <ResultsTable results={filteredResults} isLoading={isPending && results.length === 0} />

            <Alert className="mt-8 border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Aviso sobre o CORS</AlertTitle>
              <AlertDescription>
                Se os dados não carregarem, pode ser devido à política de segurança CORS da API da Caixa ao rodar o projeto localmente. A execução em um ambiente de servidor (como com `npm run dev` ou em produção na Vercel) geralmente resolve o problema.
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
