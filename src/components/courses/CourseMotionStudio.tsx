import { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Film,
  Quote,
  ListOrdered,
  Tv,
  Smartphone,
  Monitor,
  Check,
  BookOpen,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ContentProduction, CourseFormat } from "@/pages/Courses";

interface CourseMotionStudioProps {
  contents: ContentProduction[];
  courseFormats?: CourseFormat[];
  initialContentId?: string | null;
}

type SceneMode = "diagram" | "intro" | "topics" | "quote" | "lower_third";
type AspectRatioType = "16:9" | "9:16";
type BgThemeType = "dark" | "light" | "chroma";

// Funções matemáticas de animação suave (60fps)
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const clamped = Math.max(0, Math.min(1, x));
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
}

function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

function detectLessonNumber(title: string): number {
  const match = title.match(/aula\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  const numMatch = title.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 1;
}

const LESSON_DIAGRAM_METADATA: Record<
  number,
  {
    badge: string;
    diagramTitle: string;
    defaultTopics: string[];
    defaultQuote: string;
  }
> = {
  1: {
    badge: "AULA 1 • MÉTODO PASSO A PASSO",
    diagramTitle: "A Pirâmide da Base Forte (Não Comece pelo Telhado)",
    defaultTopics: [
      "1. Alinhar expectativas antes de pegar na máquina",
      "2. Fugir da armadilha de tentar realismo no 1º treino",
      "3. Usar a mesma referência e numeração de agulha da aula",
      "4. Dominar a base simples antes de soltar a criatividade"
    ],
    defaultQuote:
      "Não dá pra construir uma casa começando pelo telhado: aqui a gente foca 100% em deixar a sua base forte."
  },
  2: {
    badge: "AULA 2 • MENTALIDADE & POSTURA",
    diagramTitle: "Os 3 Pilares: Paciência, Disciplina e Responsabilidade",
    defaultTopics: [
      "1. Paciência: Respeitar o tempo da mão parar de tremer",
      "2. Disciplina: Tatuagem é memória muscular diária",
      "3. Responsabilidade: Pele humana não é papel",
      "4. Postura profissional começa já no treino no EVA"
    ],
    defaultQuote:
      "Não adianta treinar três horas num domingo e ficar duas semanas sem encostar na máquina. Tatuagem é memória muscular."
  },
  3: {
    badge: "AULA 3 • HISTÓRIA & EVOLUÇÃO",
    diagramTitle: "Linha do Tempo: Da Ancestralidade à Era Moderna",
    defaultTopics: [
      "1. Rituais ancestrais e marcas de identidade na história",
      "2. A era clássica das máquinas de bobina e solda",
      "3. Revolução moderna: Máquinas Pen e cartuchos seguros",
      "4. O papel do tatuador hoje: Arte e autoestima na pele"
    ],
    defaultQuote:
      "Entender de onde a tatuagem veio faz você respeitar cada traço que coloca na pele do seu cliente hoje."
  },
  4: {
    badge: "AULA 4 • ESTRUTURA DO ESTÚDIO",
    diagramTitle: "Planta do Estúdio: Zonas, Iluminação e Ergonomia",
    defaultTopics: [
      "1. Iluminação fria e direcionada sem sombra na mão",
      "2. Ergonomia: Ajuste entre mocho, maca e apoio de braço",
      "3. Piso e superfícies lisas de fácil desinfecção",
      "4. Separação clara entre área limpa e área de lavagem"
    ],
    defaultQuote:
      "Um estúdio funcional não precisa de luxo: precisa de iluminação certa, postura ergonômica e higiene impecável."
  },
  5: {
    badge: "AULA 5 • IMPRESSORA TÉRMICA & DECALQUE",
    diagramTitle: "As 4 Camadas do Papel Hectográfico (U20 / Térmica)",
    defaultTopics: [
      "1. Folha Branca (Topo): Onde o desenho fica espelhado",
      "2. Folha Cebola Protetora: Remover antes de imprimir!",
      "3. Folha Carbono Roxo: Transfere o pigmento térmico",
      "4. Folha Amarela (Base): Sustentação na impressora"
    ],
    defaultQuote:
      "Um decalque nítido e bem impresso é 50% do caminho para um traço seguro sem se perder no meio da sessão."
  },
  6: {
    badge: "AULA 6 • MÁQUINAS, FONTES & CABOS",
    diagramTitle: "Sincronia entre Voltagem da Fonte (V) e Velocidade da Mão",
    defaultTopics: [
      "1. 5.5V + Mão Rápida = Traço falhado e pontilhado",
      "2. 9.8V + Mão Lenta = Pele machucada e traço estourado",
      "3. 7.4V + Mão Constante = Traço sólido, limpo e uniforme",
      "4. Cuidado com cabos RCA e estabilidade de corrente"
    ],
    defaultQuote:
      "Não existe voltagem mágica universal: o segredo é casar a batida da fonte com a velocidade da sua mão."
  },
  7: {
    badge: "AULA 7 • AGULHAS, CARTUCHOS & TINTAS",
    diagramTitle: "Geometria dos Pinos: RL vs. RS vs. RM (Magnum)",
    defaultTopics: [
      "1. RL (Round Liner): Pinos soldados fechados para traço firme",
      "2. RS (Round Shader): Pinos abertos para sombra e preenchimento",
      "3. RM (Round Magnum): Duas fileiras curvadas para degradê macio",
      "4. Batoques e tintas: Organização e validade na bancada"
    ],
    defaultQuote:
      "Use exatamente a mesma numeração de cartucho da aula para conseguir comparar o seu traço com o meu."
  },
  8: {
    badge: "AULA 8 • BIOSSEGURANÇA & PROTEÇÃO",
    diagramTitle: "As 4 Barreiras Contra Contaminação Cruzada",
    defaultTopics: [
      "1. Envelopamento completo de bancada, maca e apoio",
      "2. Proteção plástica na máquina, grip, cabo e borrifador",
      "3. Luvas nitrílicas: Jamais tocar no celular ou maçaneta",
      "4. Descarte imediato do cartucho no coletor Descarpack"
    ],
    defaultQuote:
      "Biossegurança é inegociável: se tocou com a luva suja em qualquer objeto fora da bancada, troque a luva na hora."
  },
  9: {
    badge: "AULA 9 • MONTANDO A BANCADA",
    diagramTitle: "Mapa da Bancada: Zona Úmida vs. Zona Seca",
    defaultTopics: [
      "1. Filme PVC esticado com fita nas bordas da bandeja",
      "2. Ponto de vaselina na base para colar os batoques",
      "3. Copo de enxágue e borrifador sempre do lado da mão dominante",
      "4. Papel toalha dobrado na zona seca sem cruzar a agulha"
    ],
    defaultQuote:
      "Na bancada organizada, a agulha suja nunca passa por cima do papel limpo nem da vaselina."
  },
  10: {
    badge: "AULA 10 • PREPARAÇÃO DA PELE & DECALQUE",
    diagramTitle: "Triângulo de Tensão: Os 3 Dedos Esticando Antes da Agulha",
    defaultTopics: [
      "1. Higienização, tricotomia (lâmina descartável) e transfer",
      "2. Aguardar secagem de 10 a 15 minutos do decalque na pele",
      "3. Esticar em 3 pontos (Indicador, Polegar e Apoio da Mão)",
      "4. Evitar o Efeito Trampolim antes de encostar a agulha"
    ],
    defaultQuote:
      "Primeiro você trava o triângulo com os 3 dedos e deixa a pele 100% firme; só depois a agulha desce."
  },
  11: {
    badge: "AULA 11 • TÉCNICA DE TRAÇO",
    diagramTitle: "Camadas da Pele & Profundidade Ideal na Derme (1.5mm – 2mm)",
    defaultTopics: [
      "1. Epiderme (<1mm): Raso demais, o traço falha ao cicatrizar",
      "2. Derme (1.5mm – 2.0mm): Ponto ideal para linha sólida e eterna",
      "3. Hipoderme (>2.5mm): Profundo demais, gera Blowout (estouro)",
      "4. Apoio firme do punho e limpeza suave sem esfregar o decalque"
    ],
    defaultQuote:
      "Traço perfeito não é força na mão: é manter exatamente entre 1.5mm e 2mm na camada da Derme do início ao fim."
  },
  12: {
    badge: "AULA 12 • TÉCNICA DE SOMBRA",
    diagramTitle: "Movimento de Pêndulo (Vassourinha) & Degradê Suave",
    defaultTopics: [
      "1. Entrada e saída suave da agulha em arco formato 'U'",
      "2. Nunca parar a mão com a agulha dentro da pele",
      "3. Construção de camadas: Do tom mais leve para o mais escuro",
      "4. Controle de pressão para não saturar nem machucar a pele"
    ],
    defaultQuote:
      "No pêndulo, a agulha entra na pele, deposita o pigmento e sai no ar antes da mão parar — criando degradê sem marca."
  },
  13: {
    badge: "AULA 13 • FINALIZAÇÃO & AFTERCARE",
    diagramTitle: "Ciclo de 28 Dias de Cicatrização & Cuidados Pós-Tattoo",
    defaultTopics: [
      "1. Dias 1 a 3: Lavagem com sabonete neutro e secagem sem esfregar",
      "2. Dias 4 a 10: Fase das casquinhas — proibido coçar ou arrancar",
      "3. Dias 11 a 20: Hidratação em camada fina (sem sufocar os poros)",
      "4. Dia 28+: Pele regenerada e uso contínuo de protetor solar"
    ],
    defaultQuote:
      "50% do resultado final depende da sua execução na bancada; os outros 50% dependem da orientação clara de pós-cuidado."
  },
  14: {
    badge: "AULA 14 • INSTAGRAM VITRINE",
    diagramTitle: "Arquitetura do Perfil que Converte Seguidores em Clientes",
    defaultTopics: [
      "1. Bio objetiva: Especialidade + Cidade + Link direto para WhatsApp",
      "2. Destaques estratégicos: Cicatrizados, Biossegurança e Flashs",
      "3. Fotos nítidas com luz polarizada (sem filtros que distorcem)",
      "4. Reels de bastidores da bancada gerando confiança e desejo"
    ],
    defaultQuote:
      "O cliente compra primeiro a confiança na sua higiene e organização pelo Instagram antes de orçar no WhatsApp."
  },
  15: {
    badge: "AULA 15 • CAPTAÇÃO DOS PRIMEIROS CLIENTES",
    diagramTitle: "Funil de Atração Ativa & Fechamento no WhatsApp",
    defaultTopics: [
      "1. Catálogo de Flashs autorais prontos para tatuar",
      "2. Mostra dos treinos impecáveis em pele artificial",
      "3. Abordagem direta e atendimento rápido no WhatsApp",
      "4. Experiência memorável na 1ª sessão gerando indicações"
    ],
    defaultQuote:
      "Quem está começando não espera o cliente cair do céu: cria projetos irresistíveis e conduz o atendimento com segurança."
  },
  16: {
    badge: "AULA 16 • GESTÃO FINANCEIRA & SINAL",
    diagramTitle: "Divisão Inteligente do Valor da Sessão & Regra do Sinal",
    defaultTopics: [
      "1. 25% Custos da Sessão: Descartáveis, agulhas, tinta e bancada",
      "2. 25% Caixa do Estúdio: Reserva técnica e evolução de equipamentos",
      "3. 50% Remuneração Líquida: Seu pagamento como profissional",
      "4. Regra de Ouro: Horário na agenda só é travado mediante Sinal"
    ],
    defaultQuote:
      "Separar o dinheiro do material do seu lucro pessoal desde a primeira tattoo é o que mantém você crescendo na profissão."
  }
};

function extractScriptData(rawHtml: string, lessonNum: number) {
  const meta = LESSON_DIAGRAM_METADATA[lessonNum] || LESSON_DIAGRAM_METADATA[1];
  if (!rawHtml || !rawHtml.trim()) {
    return {
      topics: meta.defaultTopics,
      quotes: [meta.defaultQuote]
    };
  }

  try {
    const doc = new DOMParser().parseFromString(rawHtml, "text/html");
    const headings: string[] = [];
    doc.querySelectorAll("h3, h4, li").forEach((el) => {
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (
        txt &&
        txt.length > 6 &&
        txt.length < 110 &&
        !/^roteiro/i.test(txt) &&
        !/^\[como falar\]/i.test(txt) &&
        !/^\[fala\]/i.test(txt)
      ) {
        headings.push(txt.replace(/^\d+\.\s*/, ""));
      }
    });

    const quotes: string[] = [];
    doc.querySelectorAll("blockquote p, blockquote").forEach((el) => {
      const txt = (el.textContent || "")
        .replace(/^["“”]|["“”]$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (txt && txt.length > 25 && !quotes.includes(txt)) {
        quotes.push(txt);
      }
    });

    return {
      topics: headings.slice(0, 4).length > 0 ? headings.slice(0, 4) : meta.defaultTopics,
      quotes: quotes.length > 0 ? quotes : [meta.defaultQuote]
    };
  } catch {
    return {
      topics: meta.defaultTopics,
      quotes: [meta.defaultQuote]
    };
  }
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function CourseMotionStudio({
  contents,
  courseFormats = [],
  initialContentId
}: CourseMotionStudioProps) {
  // Lista de Cursos disponíveis
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    courseFormats.forEach((f) => {
      if (f.name) set.add(f.name);
    });
    contents.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    const arr = Array.from(set);
    return arr.length > 0 ? arr : ["Curso básico tatuador"];
  }, [courseFormats, contents]);

  const [selectedCourse, setSelectedCourse] = useState<string>(
    availableCourses[0] || "Curso básico tatuador"
  );

  // Aulas filtradas pelo Curso selecionado, ordenadas numericamente (Aula 1 .. Aula 16)
  const courseLessons = useMemo(() => {
    return contents
      .filter((c) => (c.category || "Curso básico tatuador") === selectedCourse)
      .sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", {
          numeric: true,
          sensitivity: "base"
        })
      );
  }, [contents, selectedCourse]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [sceneMode, setSceneMode] = useState<SceneMode>("diagram");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("16:9");
  const [bgTheme, setBgTheme] = useState<BgThemeType>("dark");
  const [durationSec, setDurationSec] = useState<number>(8);

  // Textos editáveis
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customQuote, setCustomQuote] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [customTopics, setCustomTopics] = useState<string[]>(["", "", "", ""]);

  // Player
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Inicializa aula selecionada
  useEffect(() => {
    if (initialContentId) {
      const target = contents.find((c) => c.id === initialContentId);
      if (target) {
        if (target.category) setSelectedCourse(target.category);
        setSelectedLessonId(target.id);
        setSceneMode("diagram");
        return;
      }
    }
    if (courseLessons.length > 0) {
      const existsInCourse = courseLessons.some((c) => c.id === selectedLessonId);
      if (!existsInCourse) {
        const aula10 = courseLessons.find((c) =>
          c.title.toLowerCase().includes("aula 10")
        );
        setSelectedLessonId(aula10 ? aula10.id : courseLessons[0].id);
      }
    }
  }, [courseLessons, initialContentId, contents]);

  const selectedLesson = useMemo(
    () => courseLessons.find((c) => c.id === selectedLessonId) || courseLessons[0] || null,
    [courseLessons, selectedLessonId]
  );

  const lessonNumber = useMemo(
    () => (selectedLesson ? detectLessonNumber(selectedLesson.title) : 10),
    [selectedLesson]
  );

  const lessonMeta = useMemo(
    () => LESSON_DIAGRAM_METADATA[lessonNumber] || LESSON_DIAGRAM_METADATA[1],
    [lessonNumber]
  );

  const extractedData = useMemo(() => {
    return extractScriptData(selectedLesson?.script_content || "", lessonNumber);
  }, [selectedLesson, lessonNumber]);

  useEffect(() => {
    if (selectedLesson) {
      setCustomTitle(selectedLesson.title);
      setCustomSubtitle(
        selectedLesson.module_name || selectedLesson.category || selectedCourse
      );
    }
    setCustomTopics([
      extractedData.topics[0] || "",
      extractedData.topics[1] || "",
      extractedData.topics[2] || "",
      extractedData.topics[3] || ""
    ]);
    setQuoteIndex(0);
    setCustomQuote(extractedData.quotes[0] || "");
    setCurrentTime(0);
    setIsPlaying(true);
  }, [selectedLessonId, extractedData, selectedLesson, selectedCourse]);

  // Loop de animação 60fps
  useEffect(() => {
    if (!isPlaying) return;
    lastTickRef.current = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= durationSec) {
          if (isRecording) return durationSec;
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, durationSec, isRecording]);

  // Renderizador Principal do Canvas (60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = aspectRatio === "16:9" ? 1920 : 1080;
    const H = aspectRatio === "16:9" ? 1080 : 1920;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    const isVert = aspectRatio === "9:16";
    const t = currentTime;
    const progress = clamp01(t / durationSec);

    const colors =
      bgTheme === "chroma"
        ? {
            bg1: "#00b140",
            bg2: "#00b140",
            card: "rgba(15, 23, 42, 0.94)",
            cardBorder: "rgba(255, 255, 255, 0.2)",
            text: "#ffffff",
            muted: "#cbd5e1",
            accent: "#3b82f6",
            accentSoft: "rgba(59, 130, 246, 0.2)",
            emerald: "#10b981",
            amber: "#f59e0b",
            red: "#ef4444"
          }
        : bgTheme === "light"
        ? {
            bg1: "#f8fafc",
            bg2: "#eef2f6",
            card: "rgba(255, 255, 255, 0.96)",
            cardBorder: "rgba(15, 23, 42, 0.12)",
            text: "#0f172a",
            muted: "#475569",
            accent: "#2563eb",
            accentSoft: "rgba(37, 99, 235, 0.12)",
            emerald: "#059669",
            amber: "#d97706",
            red: "#dc2626"
          }
        : {
            bg1: "#090d16",
            bg2: "#111827",
            card: "rgba(30, 41, 59, 0.82)",
            cardBorder: "rgba(148, 163, 184, 0.18)",
            text: "#f8fafc",
            muted: "#94a3b8",
            accent: "#3b82f6",
            accentSoft: "rgba(59, 130, 246, 0.18)",
            emerald: "#10b981",
            amber: "#f59e0b",
            red: "#ef4444"
          };

    ctx.save();
    if (bgTheme === "chroma") {
      ctx.fillStyle = "#00b140";
      ctx.fillRect(0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, colors.bg1);
      grad.addColorStop(1, colors.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle =
        bgTheme === "light"
          ? "rgba(15, 23, 42, 0.035)"
          : "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      const offset = (t * 18) % gridSize;
      for (let x = -gridSize + offset; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = -gridSize + offset; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    const padX = isVert ? 80 : 140;
    const totalW = W - padX * 2;

    // Cabeçalho padrão dos diagramas técnicos
    const drawDiagramHeader = (badgeText: string, titleText: string) => {
      ctx.fillStyle = colors.accent;
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(badgeText.toUpperCase(), padX, isVert ? 150 : 92);

      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 44 : 44}px Inter, system-ui, sans-serif`;
      const lines = wrapCanvasText(ctx, titleText, totalW);
      lines.slice(0, 2).forEach((l, i) => {
        ctx.fillText(l, padX, (isVert ? 205 : 145) + i * 50);
      });
    };

    // =========================================================================
    // MODO 1: DIAGRAMA EXCLUSIVO DE CADA UMA DAS 16 AULAS DO CURSO BÁSICO
    // =========================================================================
    if (sceneMode === "diagram") {
      drawDiagramHeader(lessonMeta.badge, lessonMeta.diagramTitle);
      const topY = isVert ? 290 : 195;
      const areaH = isVert ? 1350 : 760;

      // -----------------------------------------------------------------------
      // AULA 1: PIRÂMIDE DO APRENDIZADO (BASE FORTE vs COMEÇAR PELO TELHADO)
      // -----------------------------------------------------------------------
      if (lessonNumber === 1) {
        const colW = isVert ? totalW : (totalW - 40) / 2;
        const colH = isVert ? 620 : areaH;

        // Coluna Esquerda: O Erro Clássico (Começar pelo Telhado)
        ctx.save();
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(padX, topY, colW, colH, 26);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.font = "800 24px Inter, system-ui, sans-serif";
        ctx.fillText("❌ ERRO DO INICIANTE: COMEÇAR PELO TELHADO", padX + 36, topY + 54);

        const badSteps = [
          "1º Tentar Realismo / Fechamento Complexo",
          "2º Trocar de agulha e referência toda hora",
          "3º Não saber diagnosticar onde a mão errou",
          "RESULTADO: Frustração e vontade de desistir"
        ];
        badSteps.forEach((st, i) => {
          const anim = easeOutCubic(clamp01((t - 0.2 - i * 0.3) / 0.5));
          const sy = topY + 110 + i * 115;
          ctx.save();
          ctx.globalAlpha = anim;
          ctx.fillStyle = i === 3 ? "rgba(239, 68, 68, 0.2)" : "rgba(15, 23, 42, 0.6)";
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(padX + 36, sy, colW - 72, 92, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = i === 3 ? "#ef4444" : colors.text;
          ctx.font = "700 24px Inter, system-ui, sans-serif";
          ctx.fillText(st, padX + 64, sy + 54);
          ctx.restore();
        });
        ctx.restore();

        // Coluna Direita: O Método Luizart (Construir Base Forte)
        const rightX = isVert ? padX : padX + colW + 40;
        const rightY = isVert ? topY + colH + 35 : topY;

        ctx.save();
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(rightX, rightY, colW, colH, 26);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.font = "800 24px Inter, system-ui, sans-serif";
        ctx.fillText("✅ MÉTODO LUIZART: CONSTRUIR PELA BASE", rightX + 36, rightY + 54);

        const pyramidLevels = [
          { label: "BASE 1: Mesma Referência & Mesma Agulha", w: 0.92 },
          { label: "BASE 2: Domínio de Profundidade & Traço Firme", w: 0.82 },
          { label: "BASE 3: Sombra Limpa & Controle de Mão", w: 0.72 },
          { label: "TOPO: Liberdade Criativa & Primeiros Clientes", w: 0.62 }
        ];
        pyramidLevels.forEach((lv, i) => {
          const delay = 0.5 + i * 0.35;
          const anim = easeOutBack(clamp01((t - delay) / 0.55));
          const py = rightY + colH - 135 - i * 115;
          const pw = (colW - 72) * lv.w;
          const px = rightX + (colW - pw) / 2;

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.3);
          ctx.translate(0, (1 - anim) * 35);
          ctx.fillStyle = i === 3 ? "#10b981" : "rgba(16, 185, 129, 0.16)";
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(px, py, pw, 92, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = i === 3 ? "#090d16" : colors.text;
          ctx.font = "800 22px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(lv.label, rightX + colW / 2, py + 54);
          ctx.restore();
        });
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // AULA 2: OS 3 PILARES (PACIÊNCIA, DISCIPLINA E RESPONSABILIDADE)
      // -----------------------------------------------------------------------
      else if (lessonNumber === 2) {
        const pillars = [
          {
            num: "PILAR 01",
            title: "PACIÊNCIA",
            sub: "Respeite o Tempo da Mão",
            desc: "No início a mão treme e o traço no EVA oscila. Faz parte do processo natural.",
            metric: "Evolução Progressiva",
            color: "#3b82f6"
          },
          {
            num: "PILAR 02",
            title: "DISCIPLINA",
            sub: "Memória Muscular Diária",
            desc: "Treinar 30 min todo dia com foco vale 10x mais do que 3 horas só no domingo.",
            metric: "Constância > Pressa",
            color: "#f59e0b"
          },
          {
            num: "PILAR 03",
            title: "RESPONSABILIDADE",
            sub: "Pele Humana Não é Papel",
            desc: "É uma marca definitiva na vida e na autoestima de alguém que confiou em você.",
            metric: "Biossegurança & Respeito",
            color: "#10b981"
          }
        ];

        const cardW = isVert ? totalW : (totalW - 60) / 3;
        const cardH = isVert ? 410 : areaH;

        pillars.forEach((p, idx) => {
          const delay = 0.2 + idx * 0.4;
          const anim = easeOutBack(clamp01((t - delay) / 0.6));
          const x = isVert ? padX : padX + idx * (cardW + 30);
          const y = isVert ? topY + idx * (cardH + 30) : topY;

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.35);
          ctx.translate(0, (1 - anim) * 45);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 28);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = p.color;
          ctx.font = "800 22px Inter, system-ui, sans-serif";
          ctx.fillText(p.num, x + 36, y + 58);

          ctx.fillStyle = colors.text;
          ctx.font = "900 40px Inter, system-ui, sans-serif";
          ctx.fillText(p.title, x + 36, y + 115);

          ctx.fillStyle = p.color;
          ctx.font = "700 24px Inter, system-ui, sans-serif";
          ctx.fillText(p.sub, x + 36, y + 158);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 24px Inter, system-ui, sans-serif";
          const lines = wrapCanvasText(ctx, p.desc, cardW - 72);
          lines.forEach((l, li) => {
            ctx.fillText(l, x + 36, y + 220 + li * 36);
          });

          // Barra inferior de destaque no card
          ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x + 36, y + cardH - 95, cardW - 72, 58, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = p.color;
          ctx.font = "800 21px Inter, system-ui, sans-serif";
          ctx.fillText(p.metric, x + 56, y + cardH - 58);

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 3: LINHA DO TEMPO DA EVOLUÇÃO DA TATUAGEM
      // -----------------------------------------------------------------------
      else if (lessonNumber === 3) {
        const eras = [
          {
            era: "ERA 1 • ANCESTRALIDADE",
            title: "Rituais & Identidade",
            desc: "Instrumentos manuais (ossos e bambu). A tatuagem como símbolo de história e pertencimento.",
            color: "#f59e0b"
          },
          {
            era: "ERA 2 • CLÁSSICA (1891+)",
            title: "Máquinas de Bobina",
            desc: "Invenção da máquina elétrica e consolidação do estilo Old School e agulhas soldadas na haste.",
            color: "#3b82f6"
          },
          {
            era: "ERA 3 • REVOLUÇÃO MODERNA",
            title: "Máquinas Pen & Cartuchos",
            desc: "Precisão silenciosa, membrana de segurança contra refluxo de tinta e troca rápida de agulhas.",
            color: "#8b5cf6"
          },
          {
            era: "HOJE • ARTE & AUTOESTIMA",
            title: "Profissão de Alto Nível",
            desc: "Biossegurança hospitalar, estúdios modernos e transformação da autoestima do cliente.",
            color: "#10b981"
          }
        ];

        const rowH = isVert ? 290 : 165;
        const gap = 24;

        eras.forEach((e, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutCubic(clamp01((t - delay) / 0.5));
          const y = topY + idx * (rowH + gap);

          ctx.save();
          ctx.globalAlpha = anim;
          ctx.translate((1 - anim) * 70, 0);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(padX, y, totalW, rowH, 22);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = e.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(e.era, padX + 36, y + 44);

          ctx.fillStyle = colors.text;
          ctx.font = "800 32px Inter, system-ui, sans-serif";
          ctx.fillText(e.title, padX + 36, y + 88);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 23px Inter, system-ui, sans-serif";
          const dLines = wrapCanvasText(ctx, e.desc, totalW - 72);
          dLines.forEach((l, li) => {
            ctx.fillText(l, padX + 36, y + 128 + li * 30);
          });

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 4: O SETUP E A ESTRUTURA DO ESTÚDIO (4 ZONAS ESSENCIAIS)
      // -----------------------------------------------------------------------
      else if (lessonNumber === 4) {
        const zones = [
          {
            tag: "ZONA 01 • PROCEDIMENTO",
            title: "Maca, Mocho & Apoio de Braço",
            desc: "Mobiliário impermeável (courvin náutico) sem costuras expostas, sempre envelopado a cada cliente.",
            color: "#10b981"
          },
          {
            tag: "ZONA 02 • VISIBILIDADE",
            title: "Iluminação Fria Direcionada",
            desc: "Luz branca (5000K-6000K) posicionada no lado oposto à mão da máquina para eliminar sombras no decalque.",
            color: "#3b82f6"
          },
          {
            tag: "ZONA 03 • ESTOQUE LIMPO",
            title: "Armário Fechado de Descartáveis",
            desc: "Cartuchos, batoques, abaixadores de língua e luvas guardados longe de respingos da bancada.",
            color: "#f59e0b"
          },
          {
            tag: "ZONA 04 • DESCARTE & ASSEPSIA",
            title: "Descarpack & Lixeira de Pedal",
            desc: "Coletor rígido para agulhas e lixeira acionada apenas pelo pé para nunca tocar com a luva.",
            color: "#ef4444"
          }
        ];

        const boxW = isVert ? totalW : (totalW - 32) / 2;
        const boxH = isVert ? 300 : (areaH - 32) / 2;

        zones.forEach((z, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutBack(clamp01((t - delay) / 0.55));
          const col = isVert ? 0 : idx % 2;
          const row = isVert ? idx : Math.floor(idx / 2);
          const x = padX + col * (boxW + 32);
          const y = topY + row * (boxH + 32);

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.3);
          ctx.translate(0, (1 - anim) * 35);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = z.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 24);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = z.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(z.tag, x + 36, y + 52);

          ctx.fillStyle = colors.text;
          ctx.font = "800 34px Inter, system-ui, sans-serif";
          ctx.fillText(z.title, x + 36, y + 102);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 24px Inter, system-ui, sans-serif";
          const lines = wrapCanvasText(ctx, z.desc, boxW - 72);
          lines.forEach((l, li) => {
            ctx.fillText(l, x + 36, y + 158 + li * 34);
          });

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 5: IMPRESSORA DE DECALQUE & AS 4 CAMADAS DO PAPEL HECTOGRÁFICO
      // -----------------------------------------------------------------------
      else if (lessonNumber === 5) {
        const sheets = [
          {
            num: "CAMADA 1 (TOPO)",
            name: "Folha Branca Principal",
            action: "Recebe o decalque roxo espelhado no verso",
            status: "VAI PARA A PELE DO CLIENTE",
            color: "#f8fafc"
          },
          {
            num: "CAMADA 2 (MEIO)",
            name: "Folha Cebola Protetora (Translúcida)",
            action: "Serve apenas para não manchar no transporte",
            status: "⚠️ REMOVER E JOGAR FORA ANTES DE IMPRIMIR!",
            color: "#ef4444"
          },
          {
            num: "CAMADA 3 (CARBONO)",
            name: "Folha Carbono Térmico Roxo",
            action: "O calor da impressora derrete o carbono na folha branca",
            status: "MANTÉM NA IMPRESSORA",
            color: "#8b5cf6"
          },
          {
            num: "CAMADA 4 (BASE)",
            name: "Folha Amarela de Sustentação",
            action: "Guia o conjunto pelos roletes térmicos",
            status: "DESTACAR OU DOBRAR CONFORME O MODELO",
            color: "#f59e0b"
          }
        ];

        const cardH = isVert ? 290 : 165;
        const gap = 24;

        sheets.forEach((sh, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutCubic(clamp01((t - delay) / 0.5));
          const y = topY + idx * (cardH + gap);

          // Na camada 2 (folha cebola), anima um deslocamento lateral mostrando a remoção!
          const removeSlide =
            idx === 1 ? Math.sin(clamp01((t - 1.8) / 1.2) * Math.PI) * 35 : 0;

          ctx.save();
          ctx.globalAlpha = anim;
          ctx.translate((1 - anim) * 60 + removeSlide, 0);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = sh.color;
          ctx.lineWidth = idx === 1 ? 3 : 2;
          ctx.beginPath();
          ctx.roundRect(padX, y, totalW, cardH, 22);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = sh.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(sh.num, padX + 36, y + 46);

          ctx.fillStyle = colors.text;
          ctx.font = "800 32px Inter, system-ui, sans-serif";
          ctx.fillText(sh.name, padX + 36, y + 90);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 22px Inter, system-ui, sans-serif";
          ctx.fillText(sh.action, padX + 36, y + 130);

          if (!isVert) {
            ctx.fillStyle = idx === 1 ? "#ef4444" : "#10b981";
            ctx.font = "800 20px Inter, system-ui, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(sh.status, padX + totalW - 36, y + 90);
          }

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 6: VOLTAGEM DA FONTE vs. VELOCIDADE DA MÃO
      // -----------------------------------------------------------------------
      else if (lessonNumber === 6) {
        const tracks = [
          {
            voltage: "5.5 V",
            hz: "65 Hz • Batida Lenta",
            handLabel: "MÃO RÁPIDA DEMAIS",
            resultLabel: "RESULTADO: TRAÇO FALHADO & PONTILHADO",
            subDesc: "A agulha bate poucas vezes por segundo enquanto a mão corre.",
            color: "#f59e0b",
            bgTint: "rgba(245, 158, 11, 0.12)",
            speedFactor: 1.45,
            mode: "patchy" as const
          },
          {
            voltage: "9.8 V",
            hz: "135 Hz • Batida Muito Rápida",
            handLabel: "MÃO LENTA DEMAIS",
            resultLabel: "RESULTADO: PELE MACHUCADA & TRAÇO ESTOURADO",
            subDesc: "Excesso de batidas no mesmo ponto satura e rasga a derme.",
            color: "#ef4444",
            bgTint: "rgba(239, 68, 68, 0.12)",
            speedFactor: 0.55,
            mode: "blowout" as const
          },
          {
            voltage: "7.4 V",
            hz: "95 Hz • Batida Equilibrada",
            handLabel: "MÃO CONSTANTE & SINCRONIZADA",
            resultLabel: "RESULTADO: TRAÇO SÓLIDO, LIMPO E UNIFORME",
            subDesc: "A frequência da máquina acompanha exatamente o deslocamento da mão.",
            color: "#10b981",
            bgTint: "rgba(16, 185, 129, 0.14)",
            speedFactor: 0.95,
            mode: "solid" as const
          }
        ];

        const trackH = isVert ? 410 : 235;
        const gap = 24;

        tracks.forEach((tr, idx) => {
          const delay = 0.15 + idx * 0.3;
          const enter = easeOutCubic(clamp01((t - delay) / 0.5));
          if (enter <= 0) return;

          const y = topY + idx * (trackH + gap);

          ctx.save();
          ctx.globalAlpha = enter;
          ctx.translate(0, (1 - enter) * 25);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = tr.color;
          ctx.lineWidth = idx === 2 ? 3 : 2;
          ctx.beginPath();
          ctx.roundRect(padX, y, totalW, trackH, 24);
          ctx.fill();
          ctx.stroke();

          const visorW = isVert ? 260 : 285;
          const visorH = trackH - 36;
          const visorX = padX + 20;
          const visorY = y + 18;

          ctx.fillStyle = "#090d16";
          ctx.strokeStyle = tr.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(visorX, visorY, visorW, visorH, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#94a3b8";
          ctx.font = "700 15px Inter, system-ui, sans-serif";
          ctx.fillText("FONTE DIGITAL", visorX + 22, visorY + 34);

          ctx.fillStyle = tr.color;
          ctx.font = "900 50px monospace";
          ctx.fillText(tr.voltage, visorX + 22, visorY + 94);

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "600 17px Inter, system-ui, sans-serif";
          ctx.fillText(tr.hz, visorX + 22, visorY + 130);

          ctx.fillStyle = tr.bgTint;
          ctx.beginPath();
          ctx.roundRect(visorX + 18, visorY + 146, visorW - 36, 36, 8);
          ctx.fill();

          ctx.fillStyle = tr.color;
          ctx.font = "800 15px Inter, system-ui, sans-serif";
          ctx.fillText(tr.handLabel, visorX + 28, visorY + 169);

          const simX = visorX + visorW + 36;
          const simW = totalW - visorW - 85;
          const simTopY = y + 28;

          ctx.fillStyle = tr.color;
          ctx.font = "800 23px Inter, system-ui, sans-serif";
          ctx.fillText(tr.resultLabel, simX, simTopY + 18);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 19px Inter, system-ui, sans-serif";
          ctx.fillText(tr.subDesc, simX, simTopY + 50);

          const lineStartX = simX + 16;
          const lineEndX = simX + simW - 24;
          const lineLen = lineEndX - lineStartX;
          const lineY = y + trackH - (isVert ? 95 : 62);

          ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
          ctx.lineWidth = 16;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineY);
          ctx.lineTo(lineEndX, lineY);
          ctx.stroke();

          const rawCycle = clamp01(
            ((t - delay - 0.2) / (durationSec - 1.4)) * tr.speedFactor
          );
          const currentX = lineStartX + lineLen * rawCycle;

          if (tr.mode === "patchy") {
            const steps = 16;
            for (let s = 0; s <= steps; s++) {
              const px = lineStartX + (lineLen / steps) * s;
              if (px <= currentX) {
                ctx.fillStyle = tr.color;
                ctx.beginPath();
                ctx.arc(px, lineY + (s % 2 === 0 ? -2 : 2), 6, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else if (tr.mode === "blowout") {
            if (currentX > lineStartX) {
              ctx.strokeStyle = "rgba(239, 68, 68, 0.32)";
              ctx.lineWidth = 32;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineY);
              ctx.lineTo(currentX, lineY);
              ctx.stroke();

              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 15;
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineY);
              ctx.lineTo(currentX, lineY);
              ctx.stroke();
            }
          } else {
            if (currentX > lineStartX) {
              ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
              ctx.lineWidth = 20;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineY);
              ctx.lineTo(currentX, lineY);
              ctx.stroke();

              ctx.strokeStyle = "#10b981";
              ctx.lineWidth = 9;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineY);
              ctx.lineTo(currentX, lineY);
              ctx.stroke();
            }
          }

          const freq = tr.mode === "patchy" ? 16 : tr.mode === "blowout" ? 55 : 32;
          const needleOsc = Math.sin(t * freq) * 6;

          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(currentX, lineY - 46 + needleOsc);
          ctx.lineTo(currentX, lineY - 5 + needleOsc);
          ctx.stroke();

          ctx.fillStyle = tr.color;
          ctx.beginPath();
          ctx.arc(currentX, lineY + needleOsc * 0.4, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 7: AGULHAS, CARTUCHOS, TINTAS E BATOQUES (RL vs RS vs RM)
      // -----------------------------------------------------------------------
      else if (lessonNumber === 7) {
        const specs = [
          {
            code: "RL",
            title: "Round Liner",
            use: "Traço Firme & Contorno",
            desc: "Agulhas soldadas em círculo fechado para linhas nítidas e precisas.",
            color: "#3b82f6",
            layout: "circle-tight"
          },
          {
            code: "RS",
            title: "Round Shader",
            use: "Sombra & Preenchimento",
            desc: "Agulhas em círculo aberto para pigmentar áreas pequenas e engrossar linhas.",
            color: "#f59e0b",
            layout: "circle-wide"
          },
          {
            code: "RM",
            title: "Round Magnum",
            use: "Sombra Suave (Degradê)",
            desc: "Duas fileiras curvadas que entregam transição macia sem marcar as bordas.",
            color: "#10b981",
            layout: "magnum"
          }
        ];

        const cardW = isVert ? totalW : (totalW - 60) / 3;
        const cardH = isVert ? 410 : areaH;

        specs.forEach((sp, idx) => {
          const delay = 0.2 + idx * 0.4;
          const anim = easeOutBack(clamp01((t - delay) / 0.6));
          const x = isVert ? padX : padX + idx * (cardW + 30);
          const y = isVert ? topY + idx * (cardH + 30) : topY;

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.35);
          ctx.translate(0, (1 - anim) * 45);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = sp.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 28);
          ctx.fill();
          ctx.stroke();

          const cx = isVert ? x + 150 : x + cardW / 2;
          const cy = isVert ? y + cardH / 2 : y + 185;

          ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
          ctx.beginPath();
          ctx.arc(cx, cy, 92, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = sp.color;
          if (sp.layout === "circle-tight" || sp.layout === "circle-wide") {
            const rad = sp.layout === "circle-tight" ? 26 : 50;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            for (let k = 0; k < 6; k++) {
              const ang = (k * Math.PI * 2) / 6 + t * 1.2;
              ctx.beginPath();
              ctx.arc(
                cx + Math.cos(ang) * rad,
                cy + Math.sin(ang) * rad,
                10,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          } else {
            for (let k = -2; k <= 2; k++) {
              const curveY = Math.abs(k) * 6;
              ctx.beginPath();
              ctx.arc(cx + k * 24, cy - 14 + curveY, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(cx + k * 24, cy + 14 + curveY, 9, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          const textX = isVert ? x + 280 : x + 36;
          const textY = isVert ? y + 95 : y + 350;
          const maxTxtW = isVert ? cardW - 320 : cardW - 72;

          ctx.fillStyle = sp.color;
          ctx.font = "900 46px Inter, system-ui, sans-serif";
          ctx.fillText(sp.code, textX, textY);

          ctx.fillStyle = colors.text;
          ctx.font = "800 32px Inter, system-ui, sans-serif";
          ctx.fillText(sp.title, textX, textY + 48);

          ctx.fillStyle = sp.color;
          ctx.font = "700 24px Inter, system-ui, sans-serif";
          ctx.fillText(sp.use, textX, textY + 90);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 23px Inter, system-ui, sans-serif";
          const dLines = wrapCanvasText(ctx, sp.desc, maxTxtW);
          dLines.forEach((l, li) => {
            ctx.fillText(l, textX, textY + 140 + li * 32);
          });

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 8: BARREIRAS DE PROTEÇÃO & CONTAMINAÇÃO CRUZADA
      // -----------------------------------------------------------------------
      else if (lessonNumber === 8) {
        const barriers = [
          {
            num: "BARREIRA 01",
            title: "Envelopamento da Bancada & Maca",
            desc: "Camada dupla de plástico filme PVC cobrindo 100% da superfície de trabalho e apoio do cliente.",
            status: "BLINDAGEM DE SUPERFÍCIE",
            color: "#10b981"
          },
          {
            num: "BARREIRA 02",
            title: "Protetor de Máquina, Cabo & Borrifador",
            desc: "Saco protetor de clip cord/RCA, bandagem no grip e filme no borrifador antes de calçar a luva.",
            status: "EQUIPAMENTO ISOLADO",
            color: "#3b82f6"
          },
          {
            num: "BARREIRA 03",
            title: "Protocolo Rígido das Luvas Nitrílicas",
            desc: "Se precisar mexer no celular, na fonte sem filme ou na luminária: retire a luva e calce um par novo.",
            status: "ZERO CONTAMINAÇÃO CRUZADA",
            color: "#f59e0b"
          },
          {
            num: "BARREIRA 04",
            title: "Descarte em Coletor Rígido (Descarpack)",
            desc: "Cartuchos usados vão direto para a caixa amarela de perfurocortantes, nunca no lixo comum.",
            status: "DESCARTE SEGURO",
            color: "#ef4444"
          }
        ];

        const boxW = isVert ? totalW : (totalW - 32) / 2;
        const boxH = isVert ? 300 : (areaH - 32) / 2;

        barriers.forEach((b, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutBack(clamp01((t - delay) / 0.55));
          const col = isVert ? 0 : idx % 2;
          const row = isVert ? idx : Math.floor(idx / 2);
          const x = padX + col * (boxW + 32);
          const y = topY + row * (boxH + 32);

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.3);
          ctx.translate(0, (1 - anim) * 35);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 24);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = b.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(`${b.num} • ${b.status}`, x + 36, y + 52);

          ctx.fillStyle = colors.text;
          ctx.font = "800 32px Inter, system-ui, sans-serif";
          ctx.fillText(b.title, x + 36, y + 102);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 23px Inter, system-ui, sans-serif";
          const lines = wrapCanvasText(ctx, b.desc, boxW - 72);
          lines.forEach((l, li) => {
            ctx.fillText(l, x + 36, y + 158 + li * 34);
          });

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 9: MONTANDO A BANCADA (MAPA DE ZONA SECA vs ZONA ÚMIDA)
      // -----------------------------------------------------------------------
      else if (lessonNumber === 9) {
        ctx.save();
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = colors.cardBorder;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(padX, topY, totalW, areaH, 28);
        ctx.fill();
        ctx.stroke();

        const halfW = (totalW - 96) / 2;
        const zoneH = areaH - 130;

        // Zona Esquerda: ZONA SECA / LIMPA
        ctx.fillStyle = "rgba(59, 130, 246, 0.10)";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.roundRect(padX + 32, topY + 32, halfW, zoneH, 22);
        ctx.fill();
        ctx.stroke();

        // Zona Direita: ZONA ÚMIDA (LADO DA MÃO DOMINANTE)
        const rightZoneX = padX + 64 + halfW;
        ctx.fillStyle = "rgba(16, 185, 129, 0.10)";
        ctx.strokeStyle = "#10b981";
        ctx.beginPath();
        ctx.roundRect(rightZoneX, topY + 32, halfW, zoneH, 22);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#3b82f6";
        ctx.font = "800 24px Inter, system-ui, sans-serif";
        ctx.fillText("ZONA SECA (NÃO CRUZAR AGULHA SUJA)", padX + 64, topY + 82);

        ctx.fillStyle = "#10b981";
        ctx.fillText("ZONA ÚMIDA (LADO DA MÃO DA MÁQUINA)", rightZoneX + 32, topY + 82);

        const dryItems = [
          { name: "Papel Toalha Dobrado", sub: "Folhas prontas para limpeza rápida" },
          { name: "Cartuchos Reservas & Abaixador", sub: "Separados antes de iniciar a sessão" },
          { name: "Reserva de Vaselina Pura", sub: "Retirada apenas com espátula limpa" }
        ];
        dryItems.forEach((it, i) => {
          const anim = easeOutCubic(clamp01((t - 0.25 - i * 0.3) / 0.5));
          const iy = topY + 125 + i * 165;
          ctx.save();
          ctx.globalAlpha = anim;
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(padX + 64, iy, halfW - 64, 135, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = colors.text;
          ctx.font = "800 26px Inter, system-ui, sans-serif";
          ctx.fillText(it.name, padX + 96, iy + 56);
          ctx.fillStyle = colors.muted;
          ctx.font = "500 21px Inter, system-ui, sans-serif";
          ctx.fillText(it.sub, padX + 96, iy + 94);
          ctx.restore();
        });

        const wetItems = [
          { name: "Fileira de Batoques (Colados c/ Vaselina)", sub: "Tintas e diluentes alinhados na borda" },
          { name: "Copos Descartáveis de Enxágue", sub: "Água destilada para limpar a ponta" },
          { name: "Borrifador Envelopado + Máquina", sub: "Acesso direto sem cruzar a bancada" }
        ];
        wetItems.forEach((it, i) => {
          const anim = easeOutCubic(clamp01((t - 0.45 - i * 0.3) / 0.5));
          const iy = topY + 125 + i * 165;
          ctx.save();
          ctx.globalAlpha = anim;
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(rightZoneX + 32, iy, halfW - 64, 135, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = colors.text;
          ctx.font = "800 26px Inter, system-ui, sans-serif";
          ctx.fillText(it.name, rightZoneX + 64, iy + 56);
          ctx.fillStyle = colors.muted;
          ctx.font = "500 21px Inter, system-ui, sans-serif";
          ctx.fillText(it.sub, rightZoneX + 64, iy + 94);
          ctx.restore();
        });

        ctx.fillStyle = "#f59e0b";
        ctx.font = "800 22px Inter, system-ui, sans-serif";
        ctx.fillText(
          "REGRA DE OURO: A mão com a máquina sai do batoque direto para a pele do cliente, sem passar sobre o papel limpo.",
          padX + 40,
          topY + areaH - 36
        );
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // AULA 10: OS 3 DEDOS ESTICANDO A PELE ANTES DA AGULHA ENTRAR
      // -----------------------------------------------------------------------
      else if (lessonNumber === 10) {
        const stretchProgress = easeOutCubic(clamp01((t - 0.25) / 1.45));
        const needleEntry = easeOutCubic(clamp01((t - 1.85) / 0.55));
        const traceProgress = clamp01((t - 2.3) / (durationSec - 2.8));

        const mainBoxW = isVert ? totalW : totalW * 0.64;
        const sideBoxW = isVert ? totalW : totalW * 0.33;
        const mainBoxX = padX;
        const mainBoxY = topY;
        const mainBoxH = isVert ? 860 : areaH;

        ctx.save();
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = stretchProgress > 0.8 ? "#10b981" : colors.cardBorder;
        ctx.lineWidth = stretchProgress > 0.8 ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(mainBoxX, mainBoxY, mainBoxW, mainBoxH, 28);
        ctx.fill();
        ctx.stroke();

        const statusColor = stretchProgress > 0.8 ? "#10b981" : "#f59e0b";
        ctx.fillStyle = statusColor;
        ctx.font = "800 23px Inter, system-ui, sans-serif";
        ctx.fillText(
          stretchProgress > 0.8
            ? "PASSO 2: PELE 100% ESTICADA • AGULHA LIBERADA PARA ENTRAR"
            : "PASSO 1: POSICIONANDO E ABRINDO OS 3 DEDOS DE APOIO...",
          mainBoxX + 36,
          mainBoxY + 52
        );

        const cx = mainBoxX + mainBoxW * 0.5;
        const cy = mainBoxY + mainBoxH * 0.52;

        const gridSpanX = mainBoxW * 0.32 + stretchProgress * 55;
        const gridSpanY = mainBoxH * 0.24 + stretchProgress * 35;

        ctx.strokeStyle =
          stretchProgress > 0.8
            ? "rgba(16, 185, 129, 0.22)"
            : "rgba(245, 158, 11, 0.22)";
        ctx.lineWidth = 2;

        for (let r = -3; r <= 3; r++) {
          const ly = cy + (r * gridSpanY) / 3;
          const waveAmp = (1 - stretchProgress) * 14;
          ctx.beginPath();
          for (let sx = -20; sx <= 20; sx++) {
            const px = cx + (sx / 20) * gridSpanX;
            const py = ly + Math.sin(sx * 0.7 + r) * waveAmp;
            if (sx === -20) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        const fingerDist = 45 * stretchProgress;
        const f1 = {
          x: cx - 185 - fingerDist * 0.9,
          y: cy - 135 - fingerDist * 0.65,
          dx: -1,
          dy: -0.7,
          label: "DEDO 1: INDICADOR",
          sub: "Mão Auxiliar (Estica p/ Cima)"
        };
        const f2 = {
          x: cx - 185 - fingerDist * 0.9,
          y: cy + 145 + fingerDist * 0.65,
          dx: -1,
          dy: 0.7,
          label: "DEDO 2: POLEGAR",
          sub: "Mão Auxiliar (Estica p/ Baixo)"
        };
        const f3 = {
          x: cx + 215 + fingerDist * 1.0,
          y: cy + 10,
          dx: 1,
          dy: 0,
          label: "DEDO 3: APOIO / MINDINHO",
          sub: "Mão da Máquina (Trava a Tensão)"
        };

        ctx.save();
        ctx.fillStyle =
          stretchProgress > 0.8
            ? "rgba(16, 185, 129, 0.12)"
            : "rgba(59, 130, 246, 0.10)";
        ctx.strokeStyle = stretchProgress > 0.8 ? "#10b981" : colors.accent;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.lineTo(f3.x, f3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        const traceStartY = cy + 95;
        const traceEndY = cy - 95;
        ctx.strokeStyle = "rgba(139, 92, 246, 0.45)";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 10, traceStartY);
        ctx.lineTo(cx - 10, traceEndY);
        ctx.stroke();

        [f1, f2, f3].forEach((fg, idx) => {
          ctx.save();
          const angle = Math.atan2(fg.dy, fg.dx);

          ctx.save();
          ctx.translate(fg.x, fg.y);
          ctx.rotate(angle);

          ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
          ctx.beginPath();
          ctx.roundRect(-34, -30, 175, 60, 30);
          ctx.fill();

          const fingerGrad = ctx.createLinearGradient(-34, -26, 140, 26);
          fingerGrad.addColorStop(0, "#334155");
          fingerGrad.addColorStop(1, "#0f172a");
          ctx.fillStyle = fingerGrad;
          ctx.strokeStyle = statusColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.roundRect(-34, -26, 165, 52, 26);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-24, -16, 32, 32, 12);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(38, -16);
          ctx.lineTo(38, 16);
          ctx.moveTo(46, -12);
          ctx.lineTo(46, 12);
          ctx.stroke();
          ctx.restore();

          ctx.strokeStyle = statusColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(
            fg.x,
            fg.y,
            44 + Math.sin(t * 6 + idx) * 4,
            angle - 0.9,
            angle + 0.9
          );
          ctx.stroke();

          const arrowStartDist = 142;
          const arrowEndDist = 185 + stretchProgress * 28;
          const sx = fg.x + Math.cos(angle) * arrowStartDist;
          const sy = fg.y + Math.sin(angle) * arrowStartDist;
          const ax = fg.x + Math.cos(angle) * arrowEndDist;
          const ay = fg.y + Math.sin(angle) * arrowEndDist;

          ctx.strokeStyle = statusColor;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ax, ay);
          ctx.stroke();

          ctx.fillStyle = statusColor;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(
            ax - 18 * Math.cos(angle - Math.PI / 6),
            ay - 18 * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            ax - 18 * Math.cos(angle + Math.PI / 6),
            ay - 18 * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = statusColor;
          ctx.beginPath();
          ctx.arc(fg.x, fg.y, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#090d16";
          ctx.font = "900 18px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${idx + 1}`, fg.x, fg.y);

          ctx.textAlign = idx === 2 ? "right" : "left";
          const labelX = idx === 2 ? fg.x + 85 : fg.x - 75;
          const labelY = idx === 0 ? fg.y - 74 : idx === 1 ? fg.y + 74 : fg.y - 78;
          ctx.fillStyle = colors.text;
          ctx.font = "800 19px Inter, system-ui, sans-serif";
          ctx.fillText(fg.label, labelX, labelY);
          ctx.fillStyle = colors.muted;
          ctx.font = "600 15px Inter, system-ui, sans-serif";
          ctx.fillText(fg.sub, labelX, labelY + 22);

          ctx.restore();
        });

        const meterW = mainBoxW - 72;
        const meterX = mainBoxX + 36;
        const meterY = mainBoxY + mainBoxH - 54;
        ctx.fillStyle = "rgba(148, 163, 184, 0.18)";
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW, 16, 8);
        ctx.fill();

        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.roundRect(
          meterX,
          meterY,
          Math.max(16, meterW * stretchProgress),
          16,
          8
        );
        ctx.fill();

        ctx.fillStyle = colors.text;
        ctx.font = "700 16px Inter, system-ui, sans-serif";
        ctx.fillText(
          `TENSÃO DA PELE: ${Math.round(stretchProgress * 100)}% ${
            stretchProgress > 0.8
              ? "(PRONTA PARA A AGULHA)"
              : "(ESTICANDO COM OS 3 DEDOS...)"
          }`,
          meterX,
          meterY - 12
        );

        if (needleEntry > 0) {
          const currentTraceY =
            traceStartY + (traceEndY - traceStartY) * traceProgress;

          if (traceProgress > 0) {
            ctx.strokeStyle = "rgba(16, 185, 129, 0.28)";
            ctx.lineWidth = 20;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(cx - 10, traceStartY);
            ctx.lineTo(cx - 10, currentTraceY);
            ctx.stroke();

            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 9;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(cx - 10, traceStartY);
            ctx.lineTo(cx - 10, currentTraceY);
            ctx.stroke();
          }

          const dropOffset = (1 - needleEntry) * -120;
          const vib = Math.sin(t * 38) * 4;
          const needleX = cx - 10;
          const needleY = currentTraceY + dropOffset + vib;

          ctx.save();
          ctx.globalAlpha = needleEntry;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 9;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(needleX + 45, needleY - 95);
          ctx.lineTo(needleX, needleY);
          ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(needleX, needleY, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        const sideX = isVert ? padX : mainBoxX + mainBoxW + totalW * 0.03;
        const sideY = isVert ? mainBoxY + mainBoxH + 30 : mainBoxY;
        const sideH = isVert ? 420 : mainBoxH;

        ctx.save();
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(sideX, sideY, sideBoxW, sideH, 28);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.font = "800 22px Inter, system-ui, sans-serif";
        ctx.fillText("ERRO COMUM: SEM ESTICAR", sideX + 32, sideY + 52);

        ctx.fillStyle = colors.text;
        ctx.font = "800 28px Inter, system-ui, sans-serif";
        ctx.fillText("Efeito Trampolim", sideX + 32, sideY + 92);

        const trampCenterX = sideX + sideBoxW / 2;
        const trampBaseY = sideY + (isVert ? 210 : 280);
        const bounce = Math.abs(Math.sin(t * 8)) * 42;

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sideX + 45, trampBaseY);
        ctx.quadraticCurveTo(
          trampCenterX,
          trampBaseY + bounce * 1.6,
          sideX + sideBoxW - 45,
          trampBaseY
        );
        ctx.stroke();

        ctx.strokeStyle = colors.muted;
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trampCenterX, trampBaseY - 95 + bounce * 0.8);
        ctx.lineTo(trampCenterX, trampBaseY - 4 + bounce * 0.8);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(trampCenterX, trampBaseY + bounce * 0.8, 8, 0, Math.PI * 2);
        ctx.fill();

        const bullets = [
          "1. A pele afunda junto com a agulha",
          "2. O pigmento não entra na Derme",
          "3. A agulha engancha e o traço sai tremido"
        ];
        const bulletStartY = isVert ? sideY + 285 : sideY + 430;
        bullets.forEach((b, bi) => {
          ctx.fillStyle = colors.text;
          ctx.font = "600 21px Inter, system-ui, sans-serif";
          const bLines = wrapCanvasText(ctx, b, sideBoxW - 64);
          bLines.forEach((line, li) => {
            ctx.fillText(line, sideX + 32, bulletStartY + bi * 82 + li * 26);
          });
        });

        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // AULA 11: TRAÇO — CAMADAS DA PELE & PROFUNDIDADE NA DERME
      // -----------------------------------------------------------------------
      else if (lessonNumber === 11) {
        const layer1H = isVert ? 240 : 180;
        const layer2H = isVert ? 360 : 280;
        const layer3H = isVert ? 260 : 210;

        // Epiderme
        ctx.fillStyle = "rgba(245, 158, 11, 0.16)";
        ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(padX, topY, totalW, layer1H, [24, 24, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f59e0b";
        ctx.font = "800 28px Inter, system-ui, sans-serif";
        ctx.fillText("1. EPIDERME (0mm – 1.0mm)", padX + 36, topY + 62);
        ctx.fillStyle = colors.muted;
        ctx.font = "600 24px Inter, system-ui, sans-serif";
        ctx.fillText(
          "Raso demais: a tinta sai com a casquinha (traço falhado)",
          padX + 36,
          topY + 112
        );

        // Derme (Alvo)
        const dermeY = topY + layer1H;
        ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(padX, dermeY, totalW, layer2H);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.font = "800 32px Inter, system-ui, sans-serif";
        ctx.fillText(
          "2. DERME (1.5mm – 2.0mm) • PROFUNDIDADE EXATA DO TRAÇO",
          padX + 36,
          dermeY + 75
        );
        ctx.fillStyle = colors.text;
        ctx.font = "600 25px Inter, system-ui, sans-serif";
        ctx.fillText(
          "O pigmento encapsula e permanece nítido e firme para sempre",
          padX + 36,
          dermeY + 130
        );

        // Hipoderme
        const hipoY = dermeY + layer2H;
        ctx.fillStyle = "rgba(239, 68, 68, 0.16)";
        ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(padX, hipoY, totalW, layer3H, [0, 0, 24, 24]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.font = "800 28px Inter, system-ui, sans-serif";
        ctx.fillText(
          "3. HIPODERME (+2.5mm) • PROFUNDO DEMAIS",
          padX + 36,
          hipoY + 68
        );
        ctx.fillStyle = colors.muted;
        ctx.font = "600 24px Inter, system-ui, sans-serif";
        ctx.fillText(
          "A tinta espalha na camada de gordura causando Blowout (estouro)",
          padX + 36,
          hipoY + 118
        );

        // Agulha animada depositando tinta na Derme
        const needleX = padX + totalW * 0.78;
        const targetDepthY = dermeY + layer2H * 0.55;
        const oscillation = Math.sin(t * 28) * 18;
        const entryProgress = easeOutCubic(clamp01(t / 1.0));
        const tipY =
          topY - 60 + (targetDepthY - (topY - 60)) * entryProgress + oscillation;

        for (let i = 0; i < 7; i++) {
          const dotAppear = clamp01((t - 0.6 - i * 0.35) / 0.3);
          if (dotAppear > 0) {
            ctx.save();
            ctx.globalAlpha = dotAppear * 0.9;
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.arc(
              needleX - 130 + i * 38,
              targetDepthY + (i % 2 === 0 ? 4 : -4),
              12 * dotAppear,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
          }
        }

        ctx.save();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(needleX, topY - 90);
        ctx.lineTo(needleX, tipY);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(needleX, tipY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // AULA 12: SOMBRA — MOVIMENTO DE PÊNDULO (VASSOURINHA)
      // -----------------------------------------------------------------------
      else if (lessonNumber === 12) {
        const boxH = isVert ? 950 : areaH;
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = colors.cardBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(padX, topY, totalW, boxH, 28);
        ctx.fill();
        ctx.stroke();

        const skinSurfaceY = topY + boxH * 0.52;
        const dermeBottomY = skinSurfaceY + 135;

        ctx.fillStyle = "rgba(16, 185, 129, 0.14)";
        ctx.fillRect(padX + 40, skinSurfaceY, totalW - 80, 135);

        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(padX + 40, skinSurfaceY);
        ctx.lineTo(padX + totalW - 40, skinSurfaceY);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.font = "700 22px Inter, system-ui, sans-serif";
        ctx.fillText(
          "SUPERFÍCIE DA PELE (ENTRADA E SAÍDA SUAVE EM ARCO 'U')",
          padX + 60,
          skinSurfaceY - 20
        );

        const startArcX = padX + 140;
        const endArcX = padX + totalW - 140;
        const midArcX = (startArcX + endArcX) / 2;
        const highY = skinSurfaceY - 150;
        const lowY = skinSurfaceY + 95;

        ctx.strokeStyle = "rgba(59, 130, 246, 0.45)";
        ctx.lineWidth = 5;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(startArcX, highY);
        ctx.quadraticCurveTo(midArcX, lowY + 90, endArcX, highY);
        ctx.stroke();
        ctx.setLineDash([]);

        const swing = (Math.sin(t * 2.6 - Math.PI / 2) + 1) / 2;
        const inv = 1 - swing;
        const px =
          inv * inv * startArcX +
          2 * inv * swing * midArcX +
          swing * swing * endArcX;
        const py =
          inv * inv * highY +
          2 * inv * swing * (lowY + 90) +
          swing * swing * highY;

        const dotCols = 28;
        for (let c = 0; c < dotCols; c++) {
          const frac = c / (dotCols - 1);
          const dx = startArcX + 90 + frac * (endArcX - startArcX - 180);
          const density = Math.sin(frac * Math.PI);
          if (density > 0.15) {
            ctx.save();
            ctx.globalAlpha = density * 0.85;
            ctx.fillStyle = colors.text;
            ctx.beginPath();
            ctx.arc(dx, skinSurfaceY + 45, 4 + density * 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        ctx.save();
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px - (swing - 0.5) * 70, py - 140);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = py >= skinSurfaceY ? "#10b981" : colors.accent;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = colors.text;
        ctx.font = "700 25px Inter, system-ui, sans-serif";
        ctx.fillText(
          "A agulha entra na pele, deposita o pigmento e sai no ar antes da mão parar — degradê limpo sem marcas.",
          padX + 60,
          dermeBottomY + 90
        );
      }

      // -----------------------------------------------------------------------
      // AULA 13: CUIDADOS DE FINALIZAÇÃO (AFTERCARE & CICATRIZAÇÃO 28 DIAS)
      // -----------------------------------------------------------------------
      else if (lessonNumber === 13) {
        const phases = [
          {
            days: "DIAS 1 A 3 • FASE INFLAMATÓRIA",
            title: "Limpeza Suave & Exsudação",
            desc: "Lavar com sabonete neutro, secar pressionando papel toalha limpo (sem esfregar) e proteger de atrito.",
            color: "#3b82f6"
          },
          {
            days: "DIAS 4 A 10 • FASE DE CASQUINHA",
            title: "Proibido Coçar ou Arrancar!",
            desc: "Arrancar a casquinha puxa o pigmento da derme junto e deixa falha branca no traço.",
            color: "#ef4444"
          },
          {
            days: "DIAS 11 A 20 • HIDRATAÇÃO LEVE",
            title: "Camada Fina de Pomada Cicatrizante",
            desc: "Passar apenas um véu fino 2x a 3x ao dia; excesso de pomada abafa os poros e cria bolinhas.",
            color: "#f59e0b"
          },
          {
            days: "DIA 28+ • ESTABILIZAÇÃO FINAL",
            title: "Pele Regenerada & Protetor Solar",
            desc: "A epiderme fecha 100% sobre a derme pigmentada. Protetor solar mantém o preto vivo por anos.",
            color: "#10b981"
          }
        ];

        const rowH = isVert ? 290 : 165;
        const gap = 24;

        phases.forEach((p, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutCubic(clamp01((t - delay) / 0.5));
          const y = topY + idx * (rowH + gap);

          ctx.save();
          ctx.globalAlpha = anim;
          ctx.translate((1 - anim) * 65, 0);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(padX, y, totalW, rowH, 22);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = p.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(p.days, padX + 36, y + 46);

          ctx.fillStyle = colors.text;
          ctx.font = "800 32px Inter, system-ui, sans-serif";
          ctx.fillText(p.title, padX + 36, y + 90);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 22px Inter, system-ui, sans-serif";
          const lines = wrapCanvasText(ctx, p.desc, totalW - 72);
          lines.forEach((l, li) => {
            ctx.fillText(l, padX + 36, y + 130 + li * 30);
          });

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 14: O INSTAGRAM COMO VITRINE DO TATUADOR
      // -----------------------------------------------------------------------
      else if (lessonNumber === 14) {
        const steps = [
          {
            step: "1. BIO ESTRATÉGICA",
            title: "Clareza em 3 Segundos",
            desc: "Nome artístico + Estilo principal + Cidade/Bairro + Link direto para orçamento no WhatsApp.",
            color: "#3b82f6"
          },
          {
            step: "2. DESTAQUES DE CONFIANÇA",
            title: "Prova Social & Higiene",
            desc: "Destaques fixos: 'Cicatrizados', 'Biossegurança/Estúdio', 'Flashs Disponíveis' e 'Depoimentos'.",
            color: "#8b5cf6"
          },
          {
            step: "3. FEED DE NITIDEZ",
            title: "Foto Sem Reflexo (Luz Polarizada)",
            desc: "Nunca usar filtros escuros que escondem o traço. Mostrar o trabalho real e bem iluminado.",
            color: "#f59e0b"
          },
          {
            step: "4. REELS DE BANCADA",
            title: "Bastidores que Vendem",
            desc: "Mostrar a montagem da bancada, decalque sendo aplicado e resultado final atrai clientes qualificados.",
            color: "#10b981"
          }
        ];

        const boxW = isVert ? totalW : (totalW - 32) / 2;
        const boxH = isVert ? 300 : (areaH - 32) / 2;

        steps.forEach((st, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutBack(clamp01((t - delay) / 0.55));
          const col = isVert ? 0 : idx % 2;
          const row = isVert ? idx : Math.floor(idx / 2);
          const x = padX + col * (boxW + 32);
          const y = topY + row * (boxH + 32);

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.3);
          ctx.translate(0, (1 - anim) * 35);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = st.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 24);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = st.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(st.step, x + 36, y + 52);

          ctx.fillStyle = colors.text;
          ctx.font = "800 32px Inter, system-ui, sans-serif";
          ctx.fillText(st.title, x + 36, y + 102);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 23px Inter, system-ui, sans-serif";
          const lines = wrapCanvasText(ctx, st.desc, boxW - 72);
          lines.forEach((l, li) => {
            ctx.fillText(l, x + 36, y + 158 + li * 34);
          });

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 15: MARKETING DIRETO PARA CAPTAR OS PRIMEIROS CLIENTES
      // -----------------------------------------------------------------------
      else if (lessonNumber === 15) {
        const funnel = [
          {
            stage: "ETAPA 1 • VITRINE TÉCNICA",
            title: "Portfólio de Treinos & Flashs Exclusivos",
            desc: "Postar treinos impecáveis na pele artificial + projetos autorais com valor de portfólio.",
            widthRatio: 1.0,
            color: "#3b82f6"
          },
          {
            stage: "ETAPA 2 • ATRAÇÃO ATIVA",
            title: "Lista VIP de Amigos, Indicados & Parcerias",
            desc: "Abordagem direta oferecendo desenhos específicos que combinam com o estilo da pessoa.",
            widthRatio: 0.88,
            color: "#8b5cf6"
          },
          {
            stage: "ETAPA 3 • CONVERSÃO NO WHATSAPP",
            title: "Resposta Rápida + Orientação Segura",
            desc: "Explicar o processo, enviar referência de tamanho e passar segurança no atendimento.",
            widthRatio: 0.76,
            color: "#f59e0b"
          },
          {
            stage: "ETAPA 4 • FIDELIZAÇÃO & INDICAÇÃO",
            title: "Pós-Tattoo Acompanhado = Cliente que Traz +2",
            desc: "Chamar 7 dias depois para ver a cicatrização transforma o 1º cliente no seu maior divulgador.",
            widthRatio: 0.64,
            color: "#10b981"
          }
        ];

        const rowH = isVert ? 280 : 165;
        const gap = 24;

        funnel.forEach((f, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutBack(clamp01((t - delay) / 0.55));
          const fw = isVert ? totalW : totalW * f.widthRatio;
          const fx = padX + (totalW - fw) / 2;
          const fy = topY + idx * (rowH + gap);

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.3);
          ctx.translate(0, (1 - anim) * 35);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = f.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(fx, fy, fw, rowH, 22);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = f.color;
          ctx.font = "800 20px Inter, system-ui, sans-serif";
          ctx.fillText(f.stage, fx + 36, fy + 46);

          ctx.fillStyle = colors.text;
          ctx.font = "800 30px Inter, system-ui, sans-serif";
          ctx.fillText(f.title, fx + 36, fy + 88);

          ctx.fillStyle = colors.muted;
          ctx.font = "500 22px Inter, system-ui, sans-serif";
          ctx.fillText(f.desc, fx + 36, fy + 130);

          ctx.restore();
        });
      }

      // -----------------------------------------------------------------------
      // AULA 16: GESTÃO FINANCEIRA BÁSICA & REGRA DO SINAL
      // -----------------------------------------------------------------------
      else {
        const slices = [
          {
            pct: "25%",
            title: "Custo de Bancada & Descartáveis",
            desc: "Reposição imediata de cartuchos, tinta, plástico filme, luvas, papel e sabonete da sessão.",
            color: "#f59e0b"
          },
          {
            pct: "25%",
            title: "Caixa & Crescimento do Estúdio",
            desc: "Fundo de reserva do estúdio para upgrade de máquina, iluminação, maca e cursos.",
            color: "#3b82f6"
          },
          {
            pct: "50%",
            title: "Lucro Líquido do Tatuador",
            desc: "O seu salário real livre após garantir que o estúdio e o estoque estão 100% pagos.",
            color: "#10b981"
          }
        ];

        const cardW = isVert ? totalW : (totalW - 60) / 3;
        const cardH = isVert ? 360 : areaH - 150;

        slices.forEach((sl, idx) => {
          const delay = 0.2 + idx * 0.35;
          const anim = easeOutBack(clamp01((t - delay) / 0.55));
          const x = isVert ? padX : padX + idx * (cardW + 30);
          const y = isVert ? topY + idx * (cardH + 24) : topY;

          ctx.save();
          ctx.globalAlpha = clamp01((t - delay) / 0.35);
          ctx.translate(0, (1 - anim) * 40);

          ctx.fillStyle = colors.card;
          ctx.strokeStyle = sl.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 26);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = sl.color;
          ctx.font = "900 72px Inter, system-ui, sans-serif";
          ctx.fillText(sl.pct, x + 36, y + 105);

          ctx.fillStyle = colors.text;
          ctx.font = "800 30px Inter, system-ui, sans-serif";
          const tLines = wrapCanvasText(ctx, sl.title, cardW - 72);
          tLines.forEach((l, li) => {
            ctx.fillText(l, x + 36, y + 165 + li * 38);
          });

          ctx.fillStyle = colors.muted;
          ctx.font = "500 23px Inter, system-ui, sans-serif";
          const dLines = wrapCanvasText(ctx, sl.desc, cardW - 72);
          dLines.forEach((l, li) => {
            ctx.fillText(l, x + 36, y + 255 + li * 34);
          });

          ctx.restore();
        });

        // Faixa inferior: Regra do Sinal Obrigatório
        const bannerY = isVert ? topY + 3 * (cardH + 24) : topY + cardH + 28;
        ctx.save();
        ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(padX, bannerY, totalW, 115, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.font = "800 26px Inter, system-ui, sans-serif";
        ctx.fillText(
          "🔒 REGRA DO SINAL OBRIGATÓRIO: Nenhum horário é reservado na agenda sem o pagamento do Sinal (20% a 30%).",
          padX + 36,
          bannerY + 66
        );
        ctx.restore();
      }
    }

    // =========================================================================
    // MODO 2: CAPA DA AULA (INTRO)
    // =========================================================================
    else if (sceneMode === "intro") {
      const badgeAnim = easeOutBack(clamp01(t / 0.6));
      const titleAnim = easeOutCubic(clamp01((t - 0.2) / 0.7));
      const lineAnim = easeOutCubic(clamp01((t - 0.55) / 0.8));
      const centerY = H * 0.46;

      ctx.save();
      ctx.globalAlpha = clamp01(t / 0.4);
      ctx.translate(padX, centerY - (isVert ? 180 : 150) + (1 - badgeAnim) * 30);

      ctx.font = `700 ${isVert ? 26 : 24}px Inter, system-ui, sans-serif`;
      const subTxt = (customSubtitle || selectedCourse).toUpperCase();
      const subWidth = Math.min(totalW, ctx.measureText(subTxt).width + 48);

      ctx.fillStyle = colors.accentSoft;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, subWidth, isVert ? 56 : 52, 28);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.accent;
      ctx.textBaseline = "middle";
      ctx.fillText(subTxt, 24, isVert ? 28 : 26);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = titleAnim;
      ctx.translate(0, (1 - titleAnim) * 45);
      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 68 : 74}px Inter, system-ui, sans-serif`;
      const lines = wrapCanvasText(ctx, customTitle || "Aula", totalW);

      let currY = centerY - (isVert ? 40 : 30);
      lines.forEach((line) => {
        ctx.fillText(line, padX, currY);
        currY += isVert ? 84 : 90;
      });

      const barWidth = totalW * 0.45 * lineAnim;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(padX, currY - 20, Math.max(8, barWidth), 10, 5);
      ctx.fill();

      ctx.globalAlpha = clamp01((t - 0.7) / 0.5);
      ctx.fillStyle = colors.muted;
      ctx.font = `600 ${isVert ? 28 : 26}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        `${selectedCourse.toUpperCase()} • LUIZART TATTOO`,
        padX,
        currY + 45
      );
      ctx.restore();
    }

    // =========================================================================
    // MODO 3: TÓPICOS DO ROTEIRO
    // =========================================================================
    else if (sceneMode === "topics") {
      drawDiagramHeader(customSubtitle || selectedCourse, customTitle);
      const startY = isVert ? 320 : 225;
      const cardH = isVert ? 220 : 165;
      const gap = 26;

      customTopics.slice(0, 4).forEach((topic, idx) => {
        const delay = 0.25 + idx * 0.4;
        const itemAnim = easeOutBack(clamp01((t - delay) / 0.55));
        const itemAlpha = clamp01((t - delay) / 0.35);
        if (itemAlpha <= 0) return;

        const y = startY + idx * (cardH + gap);
        ctx.save();
        ctx.globalAlpha = itemAlpha;
        ctx.translate((1 - itemAnim) * 80, 0);

        ctx.fillStyle = colors.card;
        ctx.strokeStyle = t > delay + 0.3 ? colors.accent : colors.cardBorder;
        ctx.lineWidth = t > delay + 0.3 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(padX, y, totalW, cardH, 24);
        ctx.fill();
        ctx.stroke();

        const circleX = padX + 64;
        const circleY = y + cardH / 2;
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(circleX, circleY, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "800 28px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${idx + 1}`, circleX, circleY);

        ctx.textAlign = "left";
        ctx.fillStyle = colors.text;
        ctx.font = "700 32px Inter, system-ui, sans-serif";
        const tLines = wrapCanvasText(
          ctx,
          topic || `Tópico ${idx + 1}`,
          totalW - 160
        );
        if (tLines.length === 1) {
          ctx.fillText(tLines[0], padX + 125, circleY);
        } else {
          ctx.fillText(tLines[0], padX + 125, circleY - 20);
          ctx.fillStyle = colors.muted;
          ctx.font = "600 26px Inter, system-ui, sans-serif";
          ctx.fillText(tLines[1], padX + 125, circleY + 22);
        }
        ctx.restore();
      });
    }

    // =========================================================================
    // MODO 4: FRASE DE IMPACTO DO ROTEIRO
    // =========================================================================
    else if (sceneMode === "quote") {
      const cardAnim = easeOutCubic(clamp01(t / 0.6));
      const boxW = totalW;
      const boxH = isVert ? 780 : 580;
      const boxX = padX;
      const boxY = (H - boxH) / 2;

      ctx.save();
      ctx.globalAlpha = cardAnim;
      ctx.translate(0, (1 - cardAnim) * 40);

      ctx.fillStyle = colors.card;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 36);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY + 48, 12, boxH - 96, 6);
      ctx.fill();

      ctx.fillStyle = colors.accent;
      ctx.font = "900 110px Georgia, serif";
      ctx.fillText("“", boxX + 56, boxY + 125);

      const quoteTxt = customQuote || lessonMeta.defaultQuote;
      ctx.font = "700 44px Inter, system-ui, sans-serif";
      const qLines = wrapCanvasText(ctx, quoteTxt, boxW - 140);

      const revealProgress = clamp01((t - 0.3) / (durationSec * 0.55));
      const visibleChars = Math.floor(
        quoteTxt.length * easeOutCubic(revealProgress)
      );

      let charCount = 0;
      qLines.slice(0, 6).forEach((line, idx) => {
        const lineY = boxY + 185 + idx * 64;
        const remaining = visibleChars - charCount;
        if (remaining > 0) {
          ctx.fillStyle = colors.text;
          ctx.fillText(line.slice(0, remaining), boxX + 68, lineY);
        }
        charCount += line.length + 1;
      });

      ctx.fillStyle = colors.accent;
      ctx.font = "700 26px Inter, system-ui, sans-serif";
      ctx.fillText(customTitle.toUpperCase(), boxX + 68, boxY + boxH - 60);
      ctx.restore();
    }

    // =========================================================================
    // MODO 5: TARJA ANIMADA (LOWER THIRD PARA CAPCUT / CHROMA KEY)
    // =========================================================================
    else if (sceneMode === "lower_third") {
      const enterAnim = easeOutBack(clamp01(t / 0.65));
      const boxW = isVert ? W - 120 : 1120;
      const boxH = 190;
      const boxX = isVert ? 60 : 120;
      const boxY = H - (isVert ? 340 : 250);

      ctx.save();
      ctx.translate((1 - enterAnim) * -140, 0);
      ctx.globalAlpha = clamp01(t / 0.35);

      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(boxX + 24, boxY + 28, 10, boxH - 56, 5);
      ctx.fill();

      ctx.fillStyle = colors.accent;
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(
        (customSubtitle || selectedCourse).toUpperCase(),
        boxX + 56,
        boxY + 62
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 36px Inter, system-ui, sans-serif";
      const ltLines = wrapCanvasText(ctx, customTitle, boxW - 90);
      ctx.fillText(ltLines[0] || customTitle, boxX + 56, boxY + 118);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 20px Inter, system-ui, sans-serif";
      ctx.fillText(
        `${selectedCourse} • Luizart Tattoo`,
        boxX + 56,
        boxY + 158
      );
      ctx.restore();
    }

    // Barra de Progresso do Vídeo no rodapé
    ctx.fillStyle = "rgba(59, 130, 246, 0.85)";
    ctx.fillRect(0, H - 8, W * progress, 8);

    ctx.restore();
  }, [
    currentTime,
    durationSec,
    sceneMode,
    lessonNumber,
    lessonMeta,
    aspectRatio,
    bgTheme,
    customTitle,
    customSubtitle,
    customQuote,
    customTopics,
    selectedCourse
  ]);

  // Gravação e Download do Vídeo (.webm) em 60fps
  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    try {
      const stream = canvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (customTitle || `aula-${lessonNumber}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        a.href = url;
        a.download = `${safeName}-${sceneMode}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast.success("Vídeo Motion exportado com sucesso!");
      };

      setIsRecording(true);
      setCurrentTime(0);
      setIsPlaying(true);
      recorder.start();
      toast.info(`Gravando animação (${durationSec}s)... aguarde concluir.`);

      setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, durationSec * 1000 + 150);
    } catch (error) {
      console.error("Erro ao exportar vídeo:", error);
      setIsRecording(false);
      toast.error("Seu navegador não suportou a captura de vídeo direta.");
    }
  };

  const MODE_OPTIONS: Array<{ id: SceneMode; label: string; icon: any }> = [
    { id: "diagram", label: `Diagrama da Aula ${lessonNumber}`, icon: Sparkles },
    { id: "intro", label: "Capa da Aula", icon: Film },
    { id: "topics", label: "4 Tópicos", icon: ListOrdered },
    { id: "quote", label: "Frase Destaque", icon: Quote },
    { id: "lower_third", label: "Tarja (CapCut)", icon: Tv }
  ];

  return (
    <div className="space-y-4">
      {/* BARRA DE DIVISÃO POR CURSO / FORMATO */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-3 rounded-xl border shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 px-2 shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Curso:
          </span>
          {availableCourses.map((courseName) => {
            const count = contents.filter(
              (c) => (c.category || "Curso básico tatuador") === courseName
            ).length;
            const active = selectedCourse === courseName;
            return (
              <Button
                key={courseName}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="h-8 rounded-lg text-xs font-semibold shrink-0"
                onClick={() => setSelectedCourse(courseName)}
              >
                {courseName} ({count} aulas)
              </Button>
            );
          })}
        </div>

        <Badge variant="secondary" className="text-[11px] font-semibold">
          <Layers className="h-3 w-3 mr-1 text-primary" />
          16 Motions Exclusivos Prontos
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: LISTA DAS 16 AULAS DO CURSO & CONFIGURAÇÕES */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
            {/* Grade de Seleção Rápida das Aulas do Curso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Aulas do {selectedCourse}
                </Label>
                <span className="text-[11px] font-semibold text-primary">
                  Aula {lessonNumber} Selecionada
                </span>
              </div>

              <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1">
                {courseLessons.map((lesson) => {
                  const num = detectLessonNumber(lesson.title);
                  const meta =
                    LESSON_DIAGRAM_METADATA[num] || LESSON_DIAGRAM_METADATA[1];
                  const isSelected = lesson.id === selectedLesson?.id;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setSelectedLessonId(lesson.id);
                        setSceneMode("diagram");
                        setCurrentTime(0);
                        setIsPlaying(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 text-foreground shadow-xs"
                          : "bg-background hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {lesson.title}
                        </p>
                        <p className="text-[11px] text-primary font-medium truncate">
                          Motion: {meta.diagramTitle}
                        </p>
                      </div>
                      {isSelected && (
                        <Badge className="text-[10px] shrink-0 px-1.5 py-0">
                          No Ar
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modo da Cena para a Aula Escolhida */}
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-semibold">
                Camada Visual da Aula {lessonNumber}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {MODE_OPTIONS.map((md) => {
                  const Icon = md.icon;
                  const active = sceneMode === md.id;
                  return (
                    <button
                      key={md.id}
                      type="button"
                      onClick={() => {
                        setSceneMode(md.id);
                        if (md.id === "lower_third") {
                          setBgTheme("chroma");
                        } else if (bgTheme === "chroma") {
                          setBgTheme("dark");
                        }
                        setCurrentTime(0);
                        setIsPlaying(true);
                      }}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                        active
                          ? "bg-primary/10 text-primary border-primary/40"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{md.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formato, Fundo e Duração */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Formato</Label>
                <Select
                  value={aspectRatio}
                  onValueChange={(v) => setAspectRatio(v as AspectRatioType)}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 Aula</SelectItem>
                    <SelectItem value="9:16">9:16 Reels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fundo</Label>
                <Select
                  value={bgTheme}
                  onValueChange={(v) => setBgTheme(v as BgThemeType)}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Estúdio Dark</SelectItem>
                    <SelectItem value="light">Clean Claro</SelectItem>
                    <SelectItem value="chroma">Chroma (Verde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Duração</Label>
                <Select
                  value={String(durationSec)}
                  onValueChange={(v) => {
                    setDurationSec(Number(v));
                    setCurrentTime(0);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 segundos</SelectItem>
                    <SelectItem value="8">8 segundos</SelectItem>
                    <SelectItem value="10">10 segundos</SelectItem>
                    <SelectItem value="12">12 segundos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos de texto quando está em Capa / Tópicos / Frase / Tarja */}
            {sceneMode !== "diagram" && (
              <div className="space-y-2.5 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Título</Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                {sceneMode === "quote" && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Frase</Label>
                    <Input
                      value={customQuote}
                      onChange={(e) => setCustomQuote(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: MONITOR DE PREVIEW 60FPS & EXPORTAÇÃO */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {aspectRatio === "16:9" ? (
                  <Monitor className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {lessonMeta.diagramTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedCourse} • {selectedLesson?.title}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className="h-9 gap-1.5 text-xs font-semibold shrink-0"
                disabled={isRecording}
                onClick={handleExportVideo}
              >
                <Download className="h-3.5 w-3.5" />
                {isRecording ? "Gravando Vídeo..." : "Baixar Vídeo (.webm)"}
              </Button>
            </div>

            {/* Palco do Canvas */}
            <div className="w-full bg-muted/40 rounded-xl border overflow-hidden flex items-center justify-center p-2 sm:p-4">
              <div
                className={`relative w-full overflow-hidden rounded-lg shadow-md border border-border/60 ${
                  aspectRatio === "16:9"
                    ? "aspect-video max-w-full"
                    : "aspect-[9/16] max-w-[300px]"
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain block"
                />
              </div>
            </div>

            {/* Barra de Controle do Player */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <input
                type="range"
                min={0}
                max={durationSec}
                step={0.05}
                value={currentTime}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentTime(Number(e.target.value));
                }}
                className="flex-1 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
              />

              <span className="text-xs font-mono text-muted-foreground w-20 text-right shrink-0">
                {currentTime.toFixed(1)}s / {durationSec}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
