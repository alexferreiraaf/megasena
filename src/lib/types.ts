export interface LotteryResult {
  numero: number;
  nome: string;
  dataApuracao: string;
  listaDezenasSorteadas: string[];
  indicadorAcumulo: boolean;
  valorAcumulado: number;
  valorEstimadoProximoConcurso: number;
  listaRateioPremio: {
    descricaoFaixa: string;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
}
