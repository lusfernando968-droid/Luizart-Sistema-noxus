import { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Film,
  Layers,
  Quote,
  ListOrdered,
  Crosshair,
  Tv,
  Smartphone,
  Monitor,
  Check,
  Zap,
  Activity
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
import type { ContentProduction } from "@/pages/Courses";

interface CourseMotionStudioProps {
  contents: ContentProduction[];
  initialContentId?: string | null;
}

type SceneType =
  | "voltage_speed"
  | "skin_depth"
  | "needles"
  | "pendulum"
  | "intro"
  | "topics"
  | "quote"
  | "lower_third";

type AspectRatioType = "16:9" | "9:16";
type BgThemeType = "dark" | "light" | "chroma";

// Funções auxiliares de animação (Easing suave estilo After Effects)
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

function extractScriptData(rawHtml: string, lessonTitle: string) {
  if (!rawHtml || !rawHtml.trim()) {
    // Tópicos inteligentes automáticos caso a aula ainda esteja sem roteiro colado
    const lower = lessonTitle.toLowerCase();
    if (lower.includes("mentalidade") || lower.includes("aula 2")) {
      return {
        topics: [
          "Paciência: Respeitar o tempo de evolução da mão",
          "Disciplina: Tatuagem é memória muscular diária",
          "Responsabilidade: Pele humana não é papel",
          "Postura profissional começa já no treino"
        ],
        quotes: [
          "Não adianta treinar três horas num domingo e ficar duas semanas sem encostar na máquina. Tatuagem é memória muscular.",
          "Você não vai lidar com um pedaço de papel. É uma marca pra sempre na vida e na autoestima de alguém."
        ]
      };
    }
    if (lower.includes("agulha") || lower.includes("cartucho")) {
      return {
        topics: [
          "RL (Round Liner): Agulhas fechadas para traço firme",
          "RS (Round Shader): Agulhas abertas para sombra e preenchimento",
          "RM (Round Magnum): Transições suaves sem marcar a pele",
          "Numeração e calibre: Como escolher o cartucho certo"
        ],
        quotes: [
          "Use exatamente a mesma numeração de agulha da aula para identificar onde ajustar a sua mão."
        ]
      };
    }
    if (lower.includes("traço")) {
      return {
        topics: [
          "Esticamento da pele em 3 pontos de apoio",
          "Profundidade constante na camada da Derme (1.5mm - 2mm)",
          "Sincronia entre voltagem da máquina e velocidade da mão",
          "Postura e apoio do punho na bancada"
        ],
        quotes: [
          "Traço limpo e sólido nasce da constância de profundidade e da velocidade certa da mão."
        ]
      };
    }
    return {
      topics: [
        "1. Fundamentos e preparação do material",
        "2. Passo a passo técnico na bancada",
        "3. Erros comuns do iniciante para evitar",
        "4. Revisão prática e exercício da aula"
      ],
      quotes: [
        "Não dá pra construir uma casa começando pelo telhado: primeiro deixamos a sua base forte."
      ]
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
      topics:
        headings.slice(0, 4).length > 0
          ? headings.slice(0, 4)
          : [
              "Alinhamento de expectativas do iniciante",
              "Construir a base antes dos estilos complexos",
              "Seguir o método, referência e agulha à risca",
              "Dominar a técnica básica com consistência"
            ],
      quotes:
        quotes.length > 0
          ? quotes
          : [
              "Não dá pra construir uma casa começando pelo telhado: aqui a gente foca 100% em deixar a sua base forte."
            ]
    };
  } catch {
    return {
      topics: [
        "Fundamentos essenciais da aula",
        "Técnica aplicada passo a passo",
        "Boas práticas de bancada",
        "Exercício prático guiado"
      ],
      quotes: [
        "Primeiro a gente domina a técnica básica, depois você solta a criatividade."
      ]
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
  initialContentId
}: CourseMotionStudioProps) {
  const sortedContents = useMemo(() => {
    return [...contents].sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR", {
        numeric: true,
        sensitivity: "base"
      })
    );
  }, [contents]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [sceneType, setSceneType] = useState<SceneType>("voltage_speed");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("16:9");
  const [bgTheme, setBgTheme] = useState<BgThemeType>("dark");
  const [durationSec, setDurationSec] = useState<number>(8);

  // Estados editáveis da cena atual
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customQuote, setCustomQuote] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [customTopics, setCustomTopics] = useState<string[]>([
    "",
    "",
    "",
    ""
  ]);

  // Player e Exportação
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Seleciona Aula 6 (Máquinas, fontes e cabos) por padrão para exibir o diagrama Voltagem vs Mão
  useEffect(() => {
    if (initialContentId) {
      setSelectedLessonId(initialContentId);
      return;
    }
    if (!selectedLessonId && sortedContents.length > 0) {
      const aula6 = sortedContents.find(
        (c) =>
          c.title.toLowerCase().includes("aula 6") ||
          c.title.toLowerCase().includes("fontes")
      );
      const withScript = sortedContents.find(
        (c) => c.script_content && c.script_content.trim().length > 0
      );
      setSelectedLessonId(
        aula6 ? aula6.id : withScript ? withScript.id : sortedContents[0].id
      );
    }
  }, [sortedContents, initialContentId, selectedLessonId]);

  const selectedLesson = useMemo(
    () => sortedContents.find((c) => c.id === selectedLessonId) || null,
    [sortedContents, selectedLessonId]
  );

  const extractedData = useMemo(() => {
    if (!selectedLesson) {
      return {
        topics: [
          "Paciência na evolução do traço",
          "Disciplina diária na pele artificial",
          "Responsabilidade com a pele humana",
          "Postura profissional na bancada"
        ],
        quotes: [
          "Tatuagem é memória muscular. Constância no treino vale mais do que pressa."
        ]
      };
    }
    return extractScriptData(
      selectedLesson.script_content || "",
      selectedLesson.title
    );
  }, [selectedLesson]);

  // Sincroniza textos e sugere cena ideal quando troca a aula selecionada
  useEffect(() => {
    if (selectedLesson) {
      setCustomTitle(selectedLesson.title);
      setCustomSubtitle(
        selectedLesson.module_name ||
          selectedLesson.category ||
          "Curso Básico de Tatuador"
      );

      const lower = selectedLesson.title.toLowerCase();
      if (lower.includes("aula 6") || lower.includes("fontes") || lower.includes("máquinas")) {
        setSceneType("voltage_speed");
      } else if (lower.includes("aula 7") || lower.includes("agulhas")) {
        setSceneType("needles");
      } else if (lower.includes("aula 11") || lower.includes("traço")) {
        setSceneType("skin_depth");
      } else if (lower.includes("aula 12") || lower.includes("sombra")) {
        setSceneType("pendulum");
      } else if (selectedLesson.script_content && selectedLesson.script_content.trim()) {
        setSceneType("topics");
      }
    } else {
      setCustomTitle("Aula 6: Máquinas, fontes e cabos");
      setCustomSubtitle("Módulo 2: Estrutura, Equipamentos e Materiais");
    }
    setCustomTopics([
      extractedData.topics[0] || "1. Preparação da bancada",
      extractedData.topics[1] || "2. Ajuste de voltagem e agulha",
      extractedData.topics[2] || "3. Execução técnica passo a passo",
      extractedData.topics[3] || "4. Revisão e cuidados finais"
    ]);
    setQuoteIndex(0);
    setCustomQuote(extractedData.quotes[0] || "");
    setCurrentTime(0);
    setIsPlaying(true);
  }, [selectedLessonId, extractedData]);

  // Loop de animação a 60fps
  useEffect(() => {
    if (!isPlaying) return;
    lastTickRef.current = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= durationSec) {
          if (isRecording) {
            return durationSec;
          }
          return 0; // Loop contínuo no preview
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

  // Renderizador Canvas de Alta Definição (60fps)
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

    // Paleta de Cores conforme o Tema
    const colors =
      bgTheme === "chroma"
        ? {
            bg1: "#00b140",
            bg2: "#00b140",
            card: "rgba(15, 23, 42, 0.94)",
            cardBorder: "rgba(255, 255, 255, 0.18)",
            text: "#ffffff",
            muted: "#cbd5e1",
            accent: "#3b82f6",
            accentSoft: "rgba(59, 130, 246, 0.2)",
            emerald: "#10b981",
            amber: "#f59e0b"
          }
        : bgTheme === "light"
        ? {
            bg1: "#f8fafc",
            bg2: "#eef2f6",
            card: "rgba(255, 255, 255, 0.95)",
            cardBorder: "rgba(15, 23, 42, 0.1)",
            text: "#0f172a",
            muted: "#475569",
            accent: "#2563eb",
            accentSoft: "rgba(37, 99, 235, 0.12)",
            emerald: "#059669",
            amber: "#d97706"
          }
        : {
            bg1: "#090d16",
            bg2: "#111827",
            card: "rgba(30, 41, 59, 0.78)",
            cardBorder: "rgba(148, 163, 184, 0.18)",
            text: "#f8fafc",
            muted: "#94a3b8",
            accent: "#3b82f6",
            accentSoft: "rgba(59, 130, 246, 0.18)",
            emerald: "#10b981",
            amber: "#f59e0b"
          };

    // 1. Fundo
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

      // Grade técnica sutil em movimento
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

      // Brilho radial suave
      const glow = ctx.createRadialGradient(
        W * 0.5,
        H * 0.35,
        20,
        W * 0.5,
        H * 0.35,
        W * 0.65
      );
      glow.addColorStop(0, colors.accentSoft);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    const padX = isVert ? 90 : 160;

    // =========================================================================
    // CENA 1: INTRO / CAPA DA AULA
    // =========================================================================
    if (sceneType === "intro") {
      const badgeAnim = easeOutBack(clamp01(t / 0.6));
      const titleAnim = easeOutCubic(clamp01((t - 0.2) / 0.7));
      const lineAnim = easeOutCubic(clamp01((t - 0.55) / 0.8));

      const centerY = H * 0.46;

      // Selo do Módulo
      ctx.save();
      ctx.globalAlpha = clamp01(t / 0.4);
      ctx.translate(padX, centerY - (isVert ? 180 : 150) + (1 - badgeAnim) * 30);

      ctx.font = `700 ${isVert ? 26 : 24}px Inter, system-ui, sans-serif`;
      const subTxt = (customSubtitle || "CURSO BÁSICO DE TATUADOR").toUpperCase();
      const subWidth = Math.min(W - padX * 2, ctx.measureText(subTxt).width + 48);

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

      // Título Principal da Aula
      ctx.save();
      ctx.globalAlpha = titleAnim;
      ctx.translate(0, (1 - titleAnim) * 45);
      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 68 : 76}px Inter, system-ui, sans-serif`;
      const lines = wrapCanvasText(ctx, customTitle || "Aula", W - padX * 2);

      let currY = centerY - (isVert ? 40 : 30);
      lines.forEach((line) => {
        ctx.fillText(line, padX, currY);
        currY += isVert ? 84 : 92;
      });

      // Barra de energia animada abaixo do título
      const barWidth = (W - padX * 2) * 0.45 * lineAnim;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(padX, currY - 20, Math.max(8, barWidth), 10, 5);
      ctx.fill();

      // Assinatura do Curso no rodapé
      ctx.globalAlpha = clamp01((t - 0.7) / 0.5);
      ctx.fillStyle = colors.muted;
      ctx.font = `600 ${isVert ? 28 : 26}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        "LUIZART TATTOO • FORMAÇÃO PROFISSIONAL",
        padX,
        currY + 45
      );
      ctx.restore();
    }

    // =========================================================================
    // CENA 2: TÓPICOS DO ROTEIRO (PASSO A PASSO ANIMADO)
    // =========================================================================
    else if (sceneType === "topics") {
      const headerAnim = easeOutCubic(clamp01(t / 0.5));
      ctx.save();
      ctx.globalAlpha = headerAnim;
      ctx.fillStyle = colors.accent;
      ctx.font = `700 ${isVert ? 26 : 22}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        (customSubtitle || "PONTOS-CHAVE DA AULA").toUpperCase(),
        padX,
        isVert ? 220 : 130
      );

      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 48 : 46}px Inter, system-ui, sans-serif`;
      const titleLines = wrapCanvasText(ctx, customTitle, W - padX * 2);
      titleLines.slice(0, 2).forEach((l, i) => {
        ctx.fillText(l, padX, (isVert ? 280 : 185) + i * 54);
      });
      ctx.restore();

      const startY = isVert ? 440 : 280;
      const cardH = isVert ? 190 : 145;
      const gap = isVert ? 34 : 26;

      customTopics.slice(0, 4).forEach((topic, idx) => {
        const delay = 0.35 + idx * 0.45;
        const itemAnim = easeOutBack(clamp01((t - delay) / 0.55));
        const itemAlpha = clamp01((t - delay) / 0.35);

        if (itemAlpha <= 0) return;

        const y = startY + idx * (cardH + gap);
        ctx.save();
        ctx.globalAlpha = itemAlpha;
        ctx.translate((1 - itemAnim) * 80, 0);

        // Card
        ctx.fillStyle = colors.card;
        ctx.strokeStyle =
          t > delay + 0.3 ? colors.accent : colors.cardBorder;
        ctx.lineWidth = t > delay + 0.3 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(padX, y, W - padX * 2, cardH, 24);
        ctx.fill();
        ctx.stroke();

        // Círculo numerado
        const circleX = padX + (isVert ? 65 : 60);
        const circleY = y + cardH / 2;
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(circleX, circleY, isVert ? 34 : 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = `800 ${isVert ? 30 : 26}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${idx + 1}`, circleX, circleY);

        // Texto do Tópico
        ctx.textAlign = "left";
        ctx.fillStyle = colors.text;
        ctx.font = `700 ${isVert ? 34 : 32}px Inter, system-ui, sans-serif`;
        const tLines = wrapCanvasText(
          ctx,
          topic || `Tópico ${idx + 1}`,
          W - padX * 2 - 160
        );
        if (tLines.length === 1) {
          ctx.fillText(tLines[0], padX + 120, circleY);
        } else {
          ctx.fillText(tLines[0], padX + 120, circleY - 20);
          ctx.fillStyle = colors.muted;
          ctx.font = `600 ${isVert ? 28 : 26}px Inter, system-ui, sans-serif`;
          ctx.fillText(tLines[1], padX + 120, circleY + 22);
        }

        ctx.restore();
      });
    }

    // =========================================================================
    // CENA 3: DESTAQUE DE FALA / CITAÇÃO DO ROTEIRO
    // =========================================================================
    else if (sceneType === "quote") {
      const cardAnim = easeOutCubic(clamp01(t / 0.6));
      const boxW = W - padX * 2;
      const boxH = isVert ? 780 : 580;
      const boxX = padX;
      const boxY = (H - boxH) / 2;

      ctx.save();
      ctx.globalAlpha = cardAnim;
      ctx.translate(0, (1 - cardAnim) * 40);

      // Card principal
      ctx.fillStyle = colors.card;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 36);
      ctx.fill();
      ctx.stroke();

      // Barra lateral de destaque
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY + 48, 12, boxH - 96, 6);
      ctx.fill();

      // Aspas estilizadas
      ctx.fillStyle = colors.accent;
      ctx.font = `900 ${isVert ? 120 : 110}px Georgia, serif`;
      ctx.fillText("“", boxX + 56, boxY + 125);

      // Texto da Citação com efeito de revelação progressiva
      const quoteTxt =
        customQuote ||
        "Não dá pra construir uma casa começando pelo telhado: aqui a gente foca 100% em deixar a sua base forte.";
      ctx.font = `700 ${isVert ? 44 : 44}px Inter, system-ui, sans-serif`;
      const qLines = wrapCanvasText(ctx, quoteTxt, boxW - 140);

      const revealProgress = clamp01((t - 0.3) / (durationSec * 0.55));
      const totalChars = quoteTxt.length;
      const visibleChars = Math.floor(totalChars * easeOutCubic(revealProgress));

      let charCount = 0;
      qLines.slice(0, 6).forEach((line, idx) => {
        const lineY = boxY + 185 + idx * (isVert ? 68 : 64);
        const remaining = visibleChars - charCount;
        if (remaining > 0) {
          const sub = line.slice(0, remaining);
          ctx.fillStyle = colors.text;
          ctx.fillText(sub, boxX + 68, lineY);
        }
        charCount += line.length + 1;
      });

      // Rodapé da Citação
      ctx.fillStyle = colors.accent;
      ctx.font = `700 ${isVert ? 28 : 26}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        customTitle.toUpperCase(),
        boxX + 68,
        boxY + boxH - 60
      );

      ctx.restore();
    }

    // =========================================================================
    // CENA 4: DIAGRAMA TÉCNICO — CAMADAS DA PELE & PROFUNDIDADE DA AGULHA
    // =========================================================================
    else if (sceneType === "skin_depth") {
      // Cabeçalho
      ctx.fillStyle = colors.accent;
      ctx.font = `700 24px Inter, system-ui, sans-serif`;
      ctx.fillText("ANATOMIA & TÉCNICA DE BANCADA", padX, isVert ? 180 : 110);

      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 52 : 50}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        "Profundidade Ideal da Agulha na Pele",
        padX,
        isVert ? 245 : 170
      );

      const diagramX = padX;
      const diagramW = W - padX * 2;
      const topY = isVert ? 360 : 240;
      const layer1H = isVert ? 190 : 140; // Epiderme
      const layer2H = isVert ? 280 : 210; // Derme (Ideal)
      const layer3H = isVert ? 230 : 170; // Hipoderme

      // Camada 1: Epiderme
      ctx.fillStyle = "rgba(245, 158, 11, 0.16)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(diagramX, topY, diagramW, layer1H, [24, 24, 0, 0]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f59e0b";
      ctx.font = "800 28px Inter, system-ui, sans-serif";
      ctx.fillText("1. EPIDERME (0mm – 1.0mm)", diagramX + 36, topY + 55);
      ctx.fillStyle = colors.muted;
      ctx.font = "600 24px Inter, system-ui, sans-serif";
      ctx.fillText(
        "Raso demais: a tinta sai na cicatrização (traço falhado)",
        diagramX + 36,
        topY + 98
      );

      // Camada 2: Derme (Alvo Ideal)
      const dermeY = topY + layer1H;
      ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(diagramX, dermeY, diagramW, layer2H);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#10b981";
      ctx.font = "800 32px Inter, system-ui, sans-serif";
      ctx.fillText(
        "2. DERME PAPILAR / RETICULAR (1.5mm – 2.0mm) • PONTO IDEAL",
        diagramX + 36,
        dermeY + 65
      );
      ctx.fillStyle = colors.text;
      ctx.font = "600 25px Inter, system-ui, sans-serif";
      ctx.fillText(
        "Pigmento estabiliza com nitidez e permanece sólido por toda a vida",
        diagramX + 36,
        dermeY + 115
      );

      // Camada 3: Hipoderme
      const hipoY = dermeY + layer2H;
      ctx.fillStyle = "rgba(239, 68, 68, 0.16)";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(diagramX, hipoY, diagramW, layer3H, [0, 0, 24, 24]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.font = "800 28px Inter, system-ui, sans-serif";
      ctx.fillText(
        "3. HIPODERME (+2.5mm) • PROFUNDO DEMAIS",
        diagramX + 36,
        hipoY + 60
      );
      ctx.fillStyle = colors.muted;
      ctx.font = "600 24px Inter, system-ui, sans-serif";
      ctx.fillText(
        "Risco de Blowout (traço estourado na gordura) e cicatriz",
        diagramX + 36,
        hipoY + 105
      );

      // Simulação da Agulha e Depósito de Pigmento na Derme
      const needleX = diagramX + diagramW * 0.78;
      const targetDepthY = dermeY + layer2H * 0.52;
      const oscillation = Math.sin(t * 28) * 18;
      const entryProgress = easeOutCubic(clamp01(t / 1.0));
      const tipY =
        topY - 60 + (targetDepthY - (topY - 60)) * entryProgress + oscillation;

      // Pontos de tinta depositados na Derme
      for (let i = 0; i < 7; i++) {
        const dotAppear = clamp01((t - 0.6 - i * 0.35) / 0.3);
        if (dotAppear > 0) {
          ctx.save();
          ctx.globalAlpha = dotAppear * 0.9;
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(
            needleX - 120 + i * 36,
            targetDepthY + (i % 2 === 0 ? 4 : -4),
            12 * dotAppear,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }
      }

      // Corpo do Cartucho / Agulha
      ctx.save();
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(needleX, topY - 90);
      ctx.lineTo(needleX, tipY);
      ctx.stroke();

      // Ponta da agulha brilhante
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(needleX, tipY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // =========================================================================
    // CENA 5: DIAGRAMA TÉCNICO — COMPARATIVO DE AGULHAS (RL vs RS vs RM)
    // =========================================================================
    else if (sceneType === "needles") {
      ctx.fillStyle = colors.accent;
      ctx.font = "700 24px Inter, system-ui, sans-serif";
      ctx.fillText("GUIA VISUAL DE MATERIAIS", padX, isVert ? 180 : 115);

      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 52 : 50}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        "Agulhas & Cartuchos: Qual Usar em Cada Etapa",
        padX,
        isVert ? 245 : 175
      );

      const specs = [
        {
          code: "RL",
          title: "Round Liner",
          use: "Traço Firme & Contorno",
          desc: "Agulhas soldadas em círculo fechado para linhas nítidas",
          color: "#3b82f6",
          dots: 7,
          layout: "circle-tight"
        },
        {
          code: "RS",
          title: "Round Shader",
          use: "Sombra & Preenchimento",
          desc: "Agulhas em círculo aberto para pigmentar áreas pequenas",
          color: "#f59e0b",
          dots: 7,
          layout: "circle-wide"
        },
        {
          code: "RM",
          title: "Round Magnum",
          use: "Sombra Suave (Degradê)",
          desc: "Duas fileiras curvadas que entregam transição macia",
          color: "#10b981",
          dots: 9,
          layout: "magnum"
        }
      ];

      const totalW = W - padX * 2;
      const cardW = isVert ? totalW : (totalW - 60) / 3;
      const cardH = isVert ? 380 : 620;

      specs.forEach((sp, idx) => {
        const delay = 0.25 + idx * 0.45;
        const anim = easeOutBack(clamp01((t - delay) / 0.6));
        const alpha = clamp01((t - delay) / 0.35);
        if (alpha <= 0) return;

        const x = isVert ? padX : padX + idx * (cardW + 30);
        const y = isVert ? 330 + idx * (cardH + 35) : 250;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(0, (1 - anim) * 50);

        ctx.fillStyle = colors.card;
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 28);
        ctx.fill();
        ctx.stroke();

        // Desenho dos pinos da agulha vistos de frente
        const cx = isVert ? x + 150 : x + cardW / 2;
        const cy = isVert ? y + cardH / 2 : y + 170;

        ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
        ctx.beginPath();
        ctx.arc(cx, cy, 88, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = sp.color;
        if (sp.layout === "circle-tight" || sp.layout === "circle-wide") {
          const rad = sp.layout === "circle-tight" ? 26 : 48;
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
          // Magnum (2 fileiras curvadas)
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

        // Textos do Card
        const textX = isVert ? x + 280 : x + 36;
        const textY = isVert ? y + 95 : y + 320;
        const maxTxtW = isVert ? cardW - 320 : cardW - 72;

        ctx.fillStyle = sp.color;
        ctx.font = "900 44px Inter, system-ui, sans-serif";
        ctx.fillText(sp.code, textX, textY);

        ctx.fillStyle = colors.text;
        ctx.font = "800 30px Inter, system-ui, sans-serif";
        ctx.fillText(sp.title, textX, textY + 46);

        ctx.fillStyle = sp.color;
        ctx.font = "700 23px Inter, system-ui, sans-serif";
        ctx.fillText(sp.use, textX, textY + 86);

        ctx.fillStyle = colors.muted;
        ctx.font = "500 22px Inter, system-ui, sans-serif";
        const dLines = wrapCanvasText(ctx, sp.desc, maxTxtW);
        dLines.forEach((l, li) => {
          ctx.fillText(l, textX, textY + 132 + li * 30);
        });

        ctx.restore();
      });
    }

    // =========================================================================
    // CENA ESPECIAL AULA 6: VOLTAGEM DA FONTE vs. VELOCIDADE DA MÃO
    // =========================================================================
    else if (sceneType === "voltage_speed") {
      ctx.fillStyle = colors.accent;
      ctx.font = "700 23px Inter, system-ui, sans-serif";
      ctx.fillText(
        "AULA 6 • RELAÇÃO TÉCNICA: FONTE DE ALIMENTAÇÃO vs. MÃO",
        padX,
        isVert ? 160 : 95
      );

      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 48 : 46}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        "Sincronia entre Voltagem (V) e Velocidade da Mão",
        padX,
        isVert ? 220 : 150
      );

      const tracks = [
        {
          voltage: "5.5 V",
          hz: "65 Hz • Batida Lenta",
          handLabel: "MÃO RÁPIDA DEMAIS",
          resultLabel: "RESULTADO: TRAÇO FALHADO & PONTILHADO",
          subDesc: "A agulha bate poucas vezes por segundo enquanto a mão corre.",
          color: "#f59e0b",
          bgTint: "rgba(245, 158, 11, 0.10)",
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
          bgTint: "rgba(239, 68, 68, 0.10)",
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
          bgTint: "rgba(16, 185, 129, 0.13)",
          speedFactor: 0.95,
          mode: "solid" as const
        }
      ];

      const startY = isVert ? 290 : 195;
      const trackH = isVert ? 430 : 250;
      const gap = isVert ? 36 : 24;
      const totalW = W - padX * 2;

      tracks.forEach((tr, idx) => {
        const delay = 0.2 + idx * 0.35;
        const enter = easeOutCubic(clamp01((t - delay) / 0.5));
        if (enter <= 0) return;

        const y = startY + idx * (trackH + gap);

        ctx.save();
        ctx.globalAlpha = enter;
        ctx.translate(0, (1 - enter) * 30);

        // Card da Faixa
        ctx.fillStyle = colors.card;
        ctx.strokeStyle = tr.color;
        ctx.lineWidth = idx === 2 ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(padX, y, totalW, trackH, 24);
        ctx.fill();
        ctx.stroke();

        // Painel Digital da Fonte (Esquerda)
        const visorW = isVert ? 270 : 290;
        const visorH = trackH - 40;
        const visorX = padX + 24;
        const visorY = y + 20;

        ctx.fillStyle = "#090d16";
        ctx.strokeStyle = tr.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(visorX, visorY, visorW, visorH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "700 16px Inter, system-ui, sans-serif";
        ctx.fillText("FONTE DIGITAL", visorX + 24, visorY + 38);

        ctx.fillStyle = tr.color;
        ctx.font = "900 54px monospace";
        ctx.fillText(tr.voltage, visorX + 24, visorY + 102);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "600 18px Inter, system-ui, sans-serif";
        ctx.fillText(tr.hz, visorX + 24, visorY + 140);

        // Etiqueta de Velocidade da Mão
        ctx.fillStyle = tr.bgTint;
        ctx.beginPath();
        ctx.roundRect(visorX + 20, visorY + 158, visorW - 40, 38, 10);
        ctx.fill();

        ctx.fillStyle = tr.color;
        ctx.font = "800 16px Inter, system-ui, sans-serif";
        ctx.fillText(tr.handLabel, visorX + 32, visorY + 182);

        // Área de Simulação do Traço na Pele (Direita)
        const simX = visorX + visorW + 40;
        const simW = totalW - visorW - 95;
        const simTopY = y + 32;

        ctx.fillStyle = tr.color;
        ctx.font = "800 24px Inter, system-ui, sans-serif";
        ctx.fillText(tr.resultLabel, simX, simTopY + 18);

        ctx.fillStyle = colors.muted;
        ctx.font = "500 20px Inter, system-ui, sans-serif";
        ctx.fillText(tr.subDesc, simX, simTopY + 52);

        // Pista da Pele onde a agulha risca ao vivo
        const lineStartX = simX + 20;
        const lineEndX = simX + simW - 30;
        const lineLen = lineEndX - lineStartX;
        const lineY = y + trackH - (isVert ? 105 : 70);

        // Trilha base
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineEndX, lineY);
        ctx.stroke();

        // Progresso da mão ao longo do ciclo
        const rawCycle = clamp01(((t - delay - 0.2) / (durationSec - 1.4)) * tr.speedFactor);
        const currentX = lineStartX + lineLen * rawCycle;

        if (tr.mode === "patchy") {
          // Pontos espaçados (traço falhado por mão rápida + baixa voltagem)
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
          // Traço estourado / machucado (excesso de batida + mão lenta)
          if (currentX > lineStartX) {
            // Halo borrado de estouro na derme
            ctx.strokeStyle = "rgba(239, 68, 68, 0.32)";
            ctx.lineWidth = 34;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(currentX, lineY);
            ctx.stroke();

            // Linha central irregular e grossa
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(currentX, lineY);
            ctx.stroke();
          }
        } else {
          // Traço sólido, limpo e calibrado (Sincronia Ideal)
          if (currentX > lineStartX) {
            ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
            ctx.lineWidth = 22;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(currentX, lineY);
            ctx.stroke();

            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 10;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(currentX, lineY);
            ctx.stroke();
          }
        }

        // Biqueira / Agulha animada percorrendo a trilha
        const freq = tr.mode === "patchy" ? 16 : tr.mode === "blowout" ? 55 : 32;
        const needleOsc = Math.sin(t * freq) * 7;

        ctx.save();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(currentX, lineY - 52 + needleOsc);
        ctx.lineTo(currentX, lineY - 6 + needleOsc);
        ctx.stroke();

        ctx.fillStyle = tr.color;
        ctx.beginPath();
        ctx.arc(currentX, lineY + needleOsc * 0.4, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
      });
    }

    // =========================================================================
    // CENA ESPECIAL AULA 12: MOVIMENTO DE PÊNDULO & SOMBRA SUAVE (VASSOURINHA)
    // =========================================================================
    else if (sceneType === "pendulum") {
      ctx.fillStyle = colors.accent;
      ctx.font = "700 24px Inter, system-ui, sans-serif";
      ctx.fillText(
        "AULA 12 • TÉCNICA DE SOMBREAMENTO & TRANSIÇÃO",
        padX,
        isVert ? 175 : 105
      );

      ctx.fillStyle = colors.text;
      ctx.font = `800 ${isVert ? 50 : 48}px Inter, system-ui, sans-serif`;
      ctx.fillText(
        "Movimento de Pêndulo (Vassourinha)",
        padX,
        isVert ? 240 : 165
      );

      const boxX = padX;
      const boxW = W - padX * 2;
      const boxY = isVert ? 320 : 220;
      const boxH = isVert ? 950 : 660;

      ctx.fillStyle = colors.card;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 28);
      ctx.fill();
      ctx.stroke();

      const skinSurfaceY = boxY + boxH * 0.52;
      const dermeBottomY = skinSurfaceY + 135;

      // Faixa da Pele (Derme)
      ctx.fillStyle = "rgba(16, 185, 129, 0.14)";
      ctx.fillRect(boxX + 40, skinSurfaceY, boxW - 80, 135);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(boxX + 40, skinSurfaceY);
      ctx.lineTo(boxX + boxW - 40, skinSurfaceY);
      ctx.stroke();

      ctx.fillStyle = "#10b981";
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(
        "SUPERFÍCIE DA PELE (ENTRADA E SAÍDA SUAVE EM ARCO 'U')",
        boxX + 60,
        skinSurfaceY - 20
      );

      // Curva do Pêndulo ("U" aberto entrando na derme e saindo no ar)
      const startArcX = boxX + 140;
      const endArcX = boxX + boxW - 140;
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

      // Posição animada da agulha no pêndulo (vai e volta suave)
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

      // Degradê de pontos (Whip shading) mais denso no centro e suave nas pontas
      const dotCols = 28;
      for (let c = 0; c < dotCols; c++) {
        const frac = c / (dotCols - 1);
        const dx = startArcX + 90 + frac * (endArcX - startArcX - 180);
        const density = Math.sin(frac * Math.PI); // Mais forte no meio, zero nas bordas
        if (density > 0.15) {
          ctx.save();
          ctx.globalAlpha = density * 0.85;
          ctx.fillStyle = colors.text;
          ctx.beginPath();
          ctx.arc(
            dx,
            skinSurfaceY + 45,
            4 + density * 7,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }
      }

      // Desenho da Máquina / Agulha fazendo o pêndulo
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

      // Legenda didática na base do card
      ctx.fillStyle = colors.text;
      ctx.font = "700 26px Inter, system-ui, sans-serif";
      ctx.fillText(
        "A mão entra na pele, deposita o pigmento e sai no ar antes de parar — criando degradê sem marca de agulha.",
        boxX + 60,
        dermeBottomY + 95
      );
    }

    // =========================================================================
    // CENA 6: LOWER THIRD (TARJA ANIMADA PARA SOBREPOR NO CAPCUT/PREMIERE)
    // =========================================================================
    else if (sceneType === "lower_third") {
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

      // Barra lateral pulsante
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(boxX + 24, boxY + 28, 10, boxH - 56, 5);
      ctx.fill();

      ctx.fillStyle = colors.accent;
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(
        (customSubtitle || "CURSO BÁSICO DE TATUADOR").toUpperCase(),
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
        "Luizart Tattoo • Formação Profissional",
        boxX + 56,
        boxY + 158
      );

      ctx.restore();
    }

    // Barra de Progresso do Vídeo no rodapé do Canvas
    ctx.fillStyle = "rgba(59, 130, 246, 0.85)";
    ctx.fillRect(0, H - 8, W * progress, 8);

    ctx.restore();
  }, [
    currentTime,
    durationSec,
    sceneType,
    aspectRatio,
    bgTheme,
    customTitle,
    customSubtitle,
    customQuote,
    customTopics
  ]);

  // Gravação e Download do Vídeo (.webm) em 60fps direto do Canvas
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
        videoBitsPerSecond: 8_000_000 // Alta qualidade (8 Mbps)
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (customTitle || "motion-luizart")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        a.href = url;
        a.download = `${safeName}-${sceneType}.webm`;
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
      toast.info(`Gravando cena (${durationSec}s)... aguarde concluir.`);

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

  const SCENE_OPTIONS: Array<{
    id: SceneType;
    label: string;
    icon: any;
  }> = [
    { id: "voltage_speed", label: "Voltagem vs. Mão", icon: Zap },
    { id: "skin_depth", label: "Pele & Profundidade", icon: Crosshair },
    { id: "needles", label: "Guia de Agulhas", icon: Layers },
    { id: "pendulum", label: "Pêndulo & Sombra", icon: Activity },
    { id: "intro", label: "Capa da Aula", icon: Film },
    { id: "topics", label: "Tópicos do Roteiro", icon: ListOrdered },
    { id: "quote", label: "Frase de Impacto", icon: Quote },
    { id: "lower_third", label: "Tarja (CapCut)", icon: Tv }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* COLUNA ESQUERDA: CONTROLES DO ESTÚDIO */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm space-y-4">
          {/* Seleção da Aula do Banco */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Aula Vinculada
              </Label>
              {selectedLesson?.script_content ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0"
                >
                  <Check className="h-3 w-3 mr-1" /> Roteiro Lido
                </Badge>
              ) : null}
            </div>
            <Select
              value={selectedLessonId}
              onValueChange={setSelectedLessonId}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Escolha uma aula..." />
              </SelectTrigger>
              <SelectContent>
                {sortedContents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Estilo de Cena (Motion Template) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo de Cena (Motion)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCENE_OPTIONS.map((sc) => {
                const Icon = sc.icon;
                const active = sceneType === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setSceneType(sc.id);
                      if (sc.id === "lower_third") {
                        setBgTheme("chroma");
                      } else if (bgTheme === "chroma") {
                        setBgTheme("dark");
                      }
                      setCurrentTime(0);
                      setIsPlaying(true);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                      active
                        ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formato, Fundo e Duração */}
          <div className="grid grid-cols-3 gap-2">
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
                  <SelectItem value="5">5 segundos</SelectItem>
                  <SelectItem value="6">6 segundos</SelectItem>
                  <SelectItem value="8">8 segundos</SelectItem>
                  <SelectItem value="10">10 segundos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Edição Rápida dos Textos da Cena */}
          {(sceneType === "intro" ||
            sceneType === "topics" ||
            sceneType === "quote" ||
            sceneType === "lower_third") && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Título em Tela</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {sceneType !== "quote" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Selo / Módulo</Label>
                  <Input
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              )}

              {sceneType === "quote" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Frase do Roteiro
                    </Label>
                    {extractedData.quotes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx =
                            (quoteIndex + 1) % extractedData.quotes.length;
                          setQuoteIndex(nextIdx);
                          setCustomQuote(extractedData.quotes[nextIdx]);
                          setCurrentTime(0);
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Trocar frase ({quoteIndex + 1}/{extractedData.quotes.length})
                      </button>
                    )}
                  </div>
                  <Input
                    value={customQuote}
                    onChange={(e) => setCustomQuote(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              )}

              {sceneType === "topics" && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    4 Tópicos Animados
                  </Label>
                  {customTopics.map((tp, idx) => (
                    <Input
                      key={idx}
                      value={tp}
                      onChange={(e) => {
                        const next = [...customTopics];
                        next[idx] = e.target.value;
                        setCustomTopics(next);
                      }}
                      className="h-9 text-xs"
                    />
                  ))}
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
            <div className="flex items-center gap-2">
              {aspectRatio === "16:9" ? (
                <Monitor className="h-4 w-4 text-primary" />
              ) : (
                <Smartphone className="h-4 w-4 text-primary" />
              )}
              <span className="text-sm font-bold text-foreground">
                Preview em Tempo Real (60 FPS)
              </span>
              <Badge variant="outline" className="text-[10px]">
                {aspectRatio === "16:9" ? "1920x1080 Full HD" : "1080x1920 Reels"}
              </Badge>
            </div>

            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs font-semibold"
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

          {/* Barra de Controle do Player (Play/Pause + Scrubber) */}
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
  );
}
