"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { fetchLastTenResults, fetchSpecificContest } from "@/lib/actions";
import type { LotteryResult } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { ResultsTable } from "@/components/results-table";
import { Search } from "lucide-react";

interface LotteryTrackerClientProps {
  initialResults: LotteryResult[];
  initialError: string | null;
}

export function LotteryTrackerClient({ initialResults, initialError }: LotteryTrackerClientProps) {
  const [results, setResults] = useState<LotteryResult[]>(initialResults);
  const [isPending, startTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [clientLastUpdate, setClientLastUpdate] = useState<Date | null>(null);
  const [status, setStatus] = useState("Pronto para consulta.");

  const [filterConcurso, setFilterConcurso] = useState("");
  const [searchConcurso, setSearchConcurso] = useState("");
  const [filterData, setFilterData] = useState("");
  const [filterDezenas, setFilterDezenas] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (initialError) {
      setStatus(initialError);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados Iniciais",
        description: initialError,
      });
    } else if (initialResults.length > 0) {
      setResults(initialResults);
      setStatus(`${initialResults.length} concursos carregados com sucesso.`);
      setLastUpdate(new Date());
    } else {
        setStatus("Não foi possível carregar os dados iniciais.");
    }
  }, [initialError, initialResults, toast]);
  
  useEffect(() => {
      if (typeof window !== 'undefined' && initialResults.length > 0 && !lastUpdate) {
          setLastUpdate(new Date());
      }
  }, [initialResults, lastUpdate]);

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
      } else {
        setResults(data);
        setStatus(`${data.length} concursos carregados com sucesso.`);
        setLastUpdate(new Date());
      }

      setTimeout(() => setProgress(0), 1000);
    });
  }, [toast]);

  const handleSearchContest = useCallback(() => {
    const contestNumber = parseInt(searchConcurso, 10);
    if (!contestNumber) {
        toast({
            variant: "destructive",
            title: "Busca Inválida",
            description: "Por favor, insira um número de concurso válido.",
        });
        return;
    }

    startSearchTransition(async () => {
        setStatus(`Buscando concurso ${contestNumber}...`);
        const { data, error } = await fetchSpecificContest(contestNumber);
        
        if (error) {
            setStatus(error);
            toast({
                variant: "destructive",
                title: "Erro na Busca",
                description: error,
            });
        } else if (data) {
            setResults(prevResults => {
                const contestExists = prevResults.some(r => r.numero === data.numero);
                if (contestExists) {
                    toast({
                        title: "Concurso Já Exibido",
                        description: `O concurso ${data.numero} já está na lista.`
                    });
                    return prevResults;
                }
                const newResults = [data, ...prevResults];
                newResults.sort((a, b) => b.numero - a.numero);
                return newResults;
            });
            setStatus(`Concurso ${data.numero} adicionado à lista.`);
            setSearchConcurso("");
        }
    });
}, [searchConcurso, toast]);


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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            placeholder="Buscar concurso..." 
                            value={searchConcurso} 
                            onChange={e => setSearchConcurso(e.target.value)} 
                            disabled={isSearching}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchContest()}
                        />
                        <Button onClick={handleSearchContest} disabled={isSearching} size="icon" aria-label="Buscar Concurso">
                            <Search className="size-4" />
                        </Button>
                    </div>
                    <Input type="text" placeholder="Data (ex: 20/05)" value={filterData} onChange={e => setFilterData(e.target.value)} disabled={isPending || isSearching} />
                    <Input type="text" placeholder="Dezenas (ex: 10,25)" value={filterDezenas} onChange={e => setFilterDezenas(e.target.value)} disabled={isPending || isSearching} />
                </div>
                <div>
                  <Input type="number" placeholder="Filtrar por concurso na lista..." value={filterConcurso} onChange={e => setFilterConcurso(e.target.value)} disabled={isPending || isSearching} />
                </div>
            </div>

            {(isPending || progress > 0 || isSearching) && (
              <div className="mb-8 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{isSearching ? "Buscando concurso..." : "Processando dados..."}</label>
                <Progress value={isSearching ? undefined : progress} className={cn("w-full", isSearching && "animate-pulse")} />
              </div>
            )}
            
            <ResultsTable results={filteredResults} isLoading={isPending && results.length === 0} />
            
        </CardContent>
      </Card>
    </div>
  );
}
