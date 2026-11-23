import type { EloTierKey } from "@/components/career/EloCrestSvg";

export type TrophyIconKey =
  | "trophy"
  | "award"
  | "crown"
  | "star"
  | "flame"
  | "medal"
  | "shield"
  | "gem";

export type MetricSource =
  | "manual"
  | "clients_total"
  | "students_total"
  | "month_revenue"
  | "completed_sessions";

export interface StageMission {
  id: string;
  title: string;
  metricSource: MetricSource;
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
}

export interface CareerStage {
  id: string;
  levelNumber: number;
  eloKey: EloTierKey;
  eloName: string;
  title: string;
  trophyTitle: string;
  trophyIcon: TrophyIconKey;
  prizeTitle: string;
  prizeClaimed: boolean;
  missions: StageMission[];
}

export interface CareerBlock {
  id: string;
  title: string;
  periodLabel: string;
  stages: CareerStage[];
}

export interface CareerTestState {
  careerGoalTitle: string;
  blocks: CareerBlock[];
  assistantStages: CareerStage[];
}

export interface LiveStudioCounters {
  clientsTotal: number;
  studentsTotal: number;
  monthRevenue: number;
  completedSessions: number;
}

export const INITIAL_CAREER_TEST_STATE: CareerTestState = {
  careerGoalTitle: "Ranking Luizart · Rumo ao Desafiante",
  blocks: [
    {
      id: "block-1",
      title: "Tatuador Autônomo",
      periodLabel: "Liga Inicial",
      stages: [
        {
          id: "stage-1",
          levelNumber: 1,
          eloKey: "ferro",
          eloName: "Ferro",
          title: "Autônomo de Base",
          trophyTitle: "Troféu Agulha de Ferro",
          trophyIcon: "shield",
          prizeTitle: "Definir prêmio do Elo Ferro",
          prizeClaimed: false,
          missions: [
            {
              id: "m-1-1",
              title: "Alcançar 80 clientes cadastrados no sistema",
              metricSource: "clients_total",
              currentValue: 0,
              targetValue: 80,
              unit: "clientes",
              completed: false,
            },
            {
              id: "m-1-2",
              title: "Manter custo operacional em até 25%",
              metricSource: "manual",
              currentValue: 1,
              targetValue: 2,
              unit: "meses",
              completed: false,
            },
          ],
        },
        {
          id: "stage-2",
          levelNumber: 2,
          eloKey: "bronze",
          eloName: "Bronze",
          title: "Tatuador Artilheiro",
          trophyTitle: "Troféu Chuteira de Bronze",
          trophyIcon: "flame",
          prizeTitle: "Definir prêmio do Elo Bronze",
          prizeClaimed: false,
          missions: [
            {
              id: "m-2-1",
              title: "Bater R$ 20.000/mês com sessões de tatuagem",
              metricSource: "month_revenue",
              currentValue: 0,
              targetValue: 20000,
              unit: "R$",
              completed: false,
            },
            {
              id: "m-2-2",
              title: "Base ativa de 120 clientes no sistema",
              metricSource: "clients_total",
              currentValue: 0,
              targetValue: 120,
              unit: "clientes",
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: "block-2",
      title: "Mestre dos Cursos",
      periodLabel: "Liga Média",
      stages: [
        {
          id: "stage-3",
          levelNumber: 3,
          eloKey: "prata",
          eloName: "Prata",
          title: "Tatuador Criador",
          trophyTitle: "Troféu Câmera na Mão",
          trophyIcon: "star",
          prizeTitle: "Definir prêmio do Elo Prata",
          prizeClaimed: false,
          missions: [
            {
              id: "m-3-1",
              title: "Plataforma própria no ar (site + nuvem de vídeos)",
              metricSource: "manual",
              currentValue: 0,
              targetValue: 1,
              unit: "plataforma",
              completed: false,
            },
            {
              id: "m-3-2",
              title: "Publicar 24 conteúdos (YouTube + Instagram)",
              metricSource: "manual",
              currentValue: 4,
              targetValue: 24,
              unit: "vídeos",
              completed: false,
            },
            {
              id: "m-3-3",
              title: "Somar primeiros 20 alunos na base",
              metricSource: "students_total",
              currentValue: 0,
              targetValue: 20,
              unit: "alunos",
              completed: false,
            },
          ],
        },
        {
          id: "stage-4",
          levelNumber: 4,
          eloKey: "ouro",
          eloName: "Ouro",
          title: "Professor de Tinta",
          trophyTitle: "Troféu Mestre Splinter",
          trophyIcon: "award",
          prizeTitle: "Definir prêmio do Elo Ouro",
          prizeClaimed: false,
          missions: [
            {
              id: "m-4-1",
              title: "Chegar a 50 alunos totais (presencial + online)",
              metricSource: "students_total",
              currentValue: 0,
              targetValue: 50,
              unit: "alunos",
              completed: false,
            },
            {
              id: "m-4-2",
              title: "Curso online acessível (R$ 50–100) rodando com tráfego",
              metricSource: "manual",
              currentValue: 0,
              targetValue: 1,
              unit: "funil",
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: "block-3",
      title: "Império Tech & Estúdio",
      periodLabel: "Liga Avançada",
      stages: [
        {
          id: "stage-5",
          levelNumber: 5,
          eloKey: "platina",
          eloName: "Platina",
          title: "Fundador de SaaS",
          trophyTitle: "Troféu Steve Jobs",
          trophyIcon: "gem",
          prizeTitle: "Definir prêmio do Elo Platina",
          prizeClaimed: false,
          missions: [
            {
              id: "m-5-1",
              title: "Assinantes do Software a R$ 100/mês (hoje: 2 MVP)",
              metricSource: "manual",
              currentValue: 2,
              targetValue: 15,
              unit: "assinantes",
              completed: false,
            },
            {
              id: "m-5-2",
              title: "Mentorados ativos a R$ 400/mês (hoje: 3)",
              metricSource: "manual",
              currentValue: 3,
              targetValue: 8,
              unit: "mentorados",
              completed: false,
            },
          ],
        },
        {
          id: "stage-6",
          levelNumber: 6,
          eloKey: "diamante",
          eloName: "Diamante",
          title: "Arquiteto da Escala",
          trophyTitle: "Troféu Elon Musk da Tattoo",
          trophyIcon: "medal",
          prizeTitle: "Definir prêmio do Elo Diamante",
          prizeClaimed: false,
          missions: [
            {
              id: "m-6-1",
              title: "Alcançar 100 alunos acumulados",
              metricSource: "students_total",
              currentValue: 0,
              targetValue: 100,
              unit: "alunos",
              completed: false,
            },
            {
              id: "m-6-2",
              title: "Lançar upsells (Realismo, Desenho, História, Marketing)",
              metricSource: "manual",
              currentValue: 0,
              targetValue: 4,
              unit: "cursos",
              completed: false,
            },
            {
              id: "m-6-3",
              title: "Bater 30 assinantes ativos no software",
              metricSource: "manual",
              currentValue: 2,
              targetValue: 30,
              unit: "assinantes",
              completed: false,
            },
          ],
        },
      ],
    },
    {
      id: "block-4",
      title: "Lenda do Mercado",
      periodLabel: "Liga Elite",
      stages: [
        {
          id: "stage-7",
          levelNumber: 7,
          eloKey: "mestre",
          eloName: "Mestre",
          title: "Dono da Banca",
          trophyTitle: "Troféu Poderoso Chefão",
          trophyIcon: "trophy",
          prizeTitle: "Definir prêmio do Elo Mestre",
          prizeClaimed: false,
          missions: [
            {
              id: "m-7-1",
              title: "Alunos em bancadas pagando a estrutura do estúdio",
              metricSource: "manual",
              currentValue: 0,
              targetValue: 3,
              unit: "bancadas",
              completed: false,
            },
            {
              id: "m-7-2",
              title: "Venda de produtos e consumíveis + operação delegada",
              metricSource: "manual",
              currentValue: 0,
              targetValue: 1,
              unit: "operação",
              completed: false,
            },
            {
              id: "m-7-3",
              title: "Chegar a 50 assinantes ativos no software (R$ 5k/mês)",
              metricSource: "manual",
              currentValue: 2,
              targetValue: 50,
              unit: "assinantes",
              completed: false,
            },
          ],
        },
        {
          id: "stage-8",
          levelNumber: 8,
          eloKey: "desafiante",
          eloName: "Desafiante",
          title: "Lenda Luizart 40K",
          trophyTitle: "Troféu Desafiante 40K",
          trophyIcon: "crown",
          prizeTitle: "Definir prêmio do Elo Desafiante",
          prizeClaimed: false,
          missions: [
            {
              id: "m-8-1",
              title: "150 alunos totais + 15 mentorados (R$ 6k/mês)",
              metricSource: "students_total",
              currentValue: 0,
              targetValue: 150,
              unit: "alunos",
              completed: false,
            },
            {
              id: "m-8-2",
              title: "Consolidar R$ 40.000/mês + 1º Evento Palestra",
              metricSource: "month_revenue",
              currentValue: 0,
              targetValue: 40000,
              unit: "R$",
              completed: false,
            },
          ],
        },
      ],
    },
  ],
  assistantStages: [
    {
      id: "ast-1",
      levelNumber: 1,
      eloKey: "bronze",
      eloName: "Bronze",
      title: "Escudeiro do Estúdio",
      trophyTitle: "Troféu Radar Ligado",
      trophyIcon: "shield",
      prizeTitle: "Definir prêmio do assistente (Bronze)",
      prizeClaimed: false,
      missions: [
        {
          id: "am-1-1",
          title: "Confirmações de agenda concluídas",
          metricSource: "manual",
          currentValue: 12,
          targetValue: 20,
          unit: "confirmações",
          completed: false,
        },
        {
          id: "am-1-2",
          title: "Fichas de clientes e anamneses completas",
          metricSource: "manual",
          currentValue: 8,
          targetValue: 15,
          unit: "fichas",
          completed: false,
        },
      ],
    },
    {
      id: "ast-2",
      levelNumber: 2,
      eloKey: "ouro",
      eloName: "Ouro",
      title: "Braço Direito",
      trophyTitle: "Troféu Velocidade Máxima",
      trophyIcon: "medal",
      prizeTitle: "Definir prêmio do assistente (Ouro)",
      prizeClaimed: false,
      missions: [
        {
          id: "am-2-1",
          title: "Sessões concluídas acompanhadas",
          metricSource: "completed_sessions",
          currentValue: 0,
          targetValue: 50,
          unit: "sessões",
          completed: false,
        },
        {
          id: "am-2-2",
          title: "Triagem de alunos e leads do curso",
          metricSource: "manual",
          currentValue: 2,
          targetValue: 15,
          unit: "contatos",
          completed: false,
        },
      ],
    },
    {
      id: "ast-3",
      levelNumber: 3,
      eloKey: "desafiante",
      eloName: "Desafiante",
      title: "Comandante de Operações",
      trophyTitle: "Troféu Jarvis do Luizart",
      trophyIcon: "crown",
      prizeTitle: "Definir prêmio do assistente (Desafiante)",
      prizeClaimed: false,
      missions: [
        {
          id: "am-3-1",
          title: "Semanas com operação 100% entregue",
          metricSource: "manual",
          currentValue: 1,
          targetValue: 8,
          unit: "semanas",
          completed: false,
        },
      ],
    },
  ],
};
