import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Users,
  Settings,
  UserMinus,
  Globe,
  Hammer,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Trash2,
  Check,
  Clapperboard,
  ListChecks,
  FileText,
  Pencil,
  Layers,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface StageChecks {
  ideia: boolean;
  pre_producao: boolean;
  captacao: boolean;
  concluido: boolean;
}

export interface ContentProduction {
  id: string;
  title: string;
  module_name: string;
  category: string;
  stage: "Ideia" | "Pré-produção" | "Captação" | "Concluído";
  idea_notes: string;
  pre_production_checklist: ChecklistItem[];
  capture_checklist: ChecklistItem[];
  stage_checks: StageChecks;
  video_link?: string;
  created_at?: string;
}

export interface CourseFormat {
  id: string;
  name: string;
  target_audience: string;
  is_paid: boolean;
  base_price: number;
  description: string;
  created_at?: string;
}

export interface CourseModule {
  id: string;
  course_id: string | null;
  name: string;
  description: string;
  created_at?: string;
}

const STAGES: Array<ContentProduction["stage"]> = [
  "Ideia",
  "Pré-produção",
  "Captação",
  "Concluído"
];

const Courses = () => {
  const [activeTab, setActiveTab] = useState("producao");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRegisterStudentModalOpen, setIsRegisterStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State - Aulas Presenciais
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("1");
  const pricePerHour = 50;

  // State - Configuração de Cursos/Formatos e Módulos/Temas
  const [courseFormats, setCourseFormats] = useState<CourseFormat[]>([]);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);

  // Modal Curso / Formato
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [formatName, setFormatName] = useState("");
  const [formatAudience, setFormatAudience] = useState("");
  const [formatIsPaid, setFormatIsPaid] = useState<"paid" | "free">("paid");
  const [formatPrice, setFormatPrice] = useState("");
  const [formatDescription, setFormatDescription] = useState("");

  // Modal Módulo / Tema
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleCourseId, setModuleCourseId] = useState<string>("all");
  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");

  // State - Bastidores (Produção de Conteúdo)
  const [contents, setContents] = useState<ContentProduction[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [contentSearch, setContentSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Modal Novo Conteúdo
  const [isNewContentModalOpen, setIsNewContentModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newModule, setNewModule] = useState("");
  const [newIdeaNotes, setNewIdeaNotes] = useState("");
  const [newPreItemText, setNewPreItemText] = useState("");
  const [newPreItems, setNewPreItems] = useState<ChecklistItem[]>([]);
  const [newCaptureItemText, setNewCaptureItemText] = useState("");
  const [newCaptureItems, setNewCaptureItems] = useState<ChecklistItem[]>([]);

  // Modal Detalhes / Check-in de Conteúdo Selecionado
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [detailPreInput, setDetailPreInput] = useState("");
  const [detailCaptureInput, setDetailCaptureInput] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingModule, setEditingModule] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingNotes, setEditingNotes] = useState("");

  const selectedContent = useMemo(
    () => contents.find((c) => c.id === selectedContentId) || null,
    [contents, selectedContentId]
  );

  useEffect(() => {
    fetchClients();
    fetchCoursesAndModules();
    fetchContents();
  }, []);

  useEffect(() => {
    if (selectedContent) {
      setEditingTitle(selectedContent.title);
      setEditingModule(selectedContent.module_name || "");
      setEditingCategory(selectedContent.category || "");
      setEditingNotes(selectedContent.idea_notes || "");
    }
  }, [selectedContentId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, name, is_student, avatar_url, phone")
        .order("name");
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const fetchCoursesAndModules = async () => {
    try {
      const [coursesRes, modulesRes] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: true }),
        supabase.from("course_modules").select("*").order("created_at", { ascending: true })
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (modulesRes.error) throw modulesRes.error;

      const loadedFormats: CourseFormat[] = (coursesRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        target_audience: r.target_audience || "",
        is_paid: r.is_paid !== undefined ? Boolean(r.is_paid) : true,
        base_price: Number(r.base_price || 0),
        description: r.description || "",
        created_at: r.created_at
      }));

      const loadedModules: CourseModule[] = (modulesRes.data || []).map((m: any) => ({
        id: m.id,
        course_id: m.course_id || null,
        name: m.name,
        description: m.description || "",
        created_at: m.created_at
      }));

      setCourseFormats(loadedFormats);
      setCourseModules(loadedModules);

      if (loadedFormats.length > 0 && !newCategory) {
        setNewCategory(loadedFormats[0].name);
      }
    } catch (error) {
      console.error("Erro ao carregar cursos e módulos:", error);
    }
  };

  const fetchContents = async () => {
    try {
      setLoadingContents(true);
      const { data, error } = await supabase
        .from("content_productions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const normalized: ContentProduction[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        module_name: row.module_name || "",
        category: row.category || "",
        stage: row.stage || "Ideia",
        idea_notes: row.idea_notes || "",
        pre_production_checklist: Array.isArray(row.pre_production_checklist)
          ? row.pre_production_checklist
          : [],
        capture_checklist: Array.isArray(row.capture_checklist)
          ? row.capture_checklist
          : [],
        stage_checks: row.stage_checks || {
          ideia: true,
          pre_producao: false,
          captacao: false,
          concluido: false
        },
        video_link: row.video_link || "",
        created_at: row.created_at
      }));

      setContents(normalized);
    } catch (error) {
      console.error("Erro ao carregar produção de conteúdo:", error);
      toast.error("Erro ao carregar lista de conteúdos");
    } finally {
      setLoadingContents(false);
    }
  };

  // Módulos filtrados conforme o Curso/Formato escolhido no modal de Novo Conteúdo
  const availableModulesForNewContent = useMemo(() => {
    const selectedFormat = courseFormats.find((f) => f.name === newCategory);
    if (!selectedFormat) return courseModules;
    return courseModules.filter(
      (m) => !m.course_id || m.course_id === selectedFormat.id
    );
  }, [courseFormats, courseModules, newCategory]);

  // Módulos filtrados conforme o Curso/Formato escolhido no modal de Edição de Conteúdo
  const availableModulesForEditingContent = useMemo(() => {
    const selectedFormat = courseFormats.find((f) => f.name === editingCategory);
    if (!selectedFormat) return courseModules;
    return courseModules.filter(
      (m) => !m.course_id || m.course_id === selectedFormat.id
    );
  }, [courseFormats, courseModules, editingCategory]);

  // =========================================================================
  // GESTÃO DE CURSOS / FORMATOS & MÓDULOS / TEMAS (ABA CONFIGURAÇÕES)
  // =========================================================================

  const openNewFormatModal = () => {
    setEditingFormatId(null);
    setFormatName("");
    setFormatAudience("");
    setFormatIsPaid("paid");
    setFormatPrice("");
    setFormatDescription("");
    setIsFormatModalOpen(true);
  };

  const openEditFormatModal = (format: CourseFormat) => {
    setEditingFormatId(format.id);
    setFormatName(format.name);
    setFormatAudience(format.target_audience || "");
    setFormatIsPaid(format.is_paid ? "paid" : "free");
    setFormatPrice(format.base_price > 0 ? String(format.base_price) : "");
    setFormatDescription(format.description || "");
    setIsFormatModalOpen(true);
  };

  const handleSaveFormat = async () => {
    if (!formatName.trim()) {
      toast.error("Digite o nome do curso ou formato");
      return;
    }

    try {
      setLoading(true);
      const isPaidBool = formatIsPaid === "paid";
      const numericPrice = isPaidBool && formatPrice ? Number(formatPrice) : 0;

      const payload = {
        name: formatName.trim(),
        target_audience: formatAudience.trim(),
        is_paid: isPaidBool,
        base_price: numericPrice,
        description: formatDescription.trim()
      };

      if (editingFormatId) {
        const oldFormat = courseFormats.find((f) => f.id === editingFormatId);
        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingFormatId);
        if (error) throw error;

        // Se mudou o nome do formato, atualiza nos conteúdos vinculados
        if (oldFormat && oldFormat.name !== payload.name) {
          await supabase
            .from("content_productions")
            .update({ category: payload.name })
            .eq("category", oldFormat.name);
          fetchContents();
        }

        toast.success("Curso / Formato atualizado!");
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
        toast.success("Curso / Formato cadastrado!");
      }

      setIsFormatModalOpen(false);
      fetchCoursesAndModules();
    } catch (error) {
      console.error("Erro ao salvar formato:", error);
      toast.error("Erro ao salvar curso/formato");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFormat = async (id: string) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Curso / Formato excluído");
      fetchCoursesAndModules();
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
      toast.error("Erro ao excluir curso/formato");
    }
  };

  const openNewModuleModal = () => {
    setEditingModuleId(null);
    setModuleCourseId(courseFormats[0]?.id || "all");
    setModuleName("");
    setModuleDescription("");
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (mod: CourseModule) => {
    setEditingModuleId(mod.id);
    setModuleCourseId(mod.course_id || "all");
    setModuleName(mod.name);
    setModuleDescription(mod.description || "");
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async () => {
    if (!moduleName.trim()) {
      toast.error("Digite o nome do módulo ou tema");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        course_id: moduleCourseId === "all" ? null : moduleCourseId,
        name: moduleName.trim(),
        description: moduleDescription.trim()
      };

      if (editingModuleId) {
        const oldMod = courseModules.find((m) => m.id === editingModuleId);
        const { error } = await supabase
          .from("course_modules")
          .update(payload)
          .eq("id", editingModuleId);
        if (error) throw error;

        if (oldMod && oldMod.name !== payload.name) {
          await supabase
            .from("content_productions")
            .update({ module_name: payload.name })
            .eq("module_name", oldMod.name);
          fetchContents();
        }

        toast.success("Módulo / Tema atualizado!");
      } else {
        const { error } = await supabase.from("course_modules").insert(payload);
        if (error) throw error;
        toast.success("Módulo / Tema cadastrado!");
      }

      setIsModuleModalOpen(false);
      fetchCoursesAndModules();
    } catch (error) {
      console.error("Erro ao salvar módulo:", error);
      toast.error("Erro ao salvar módulo/tema");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Módulo / Tema excluído");
      fetchCoursesAndModules();
    } catch (error) {
      console.error("Erro ao excluir módulo:", error);
      toast.error("Erro ao excluir módulo/tema");
    }
  };

  // =========================================================================
  // FUNÇÕES DE AULAS PRESENCIAIS
  // =========================================================================

  const calculateEndTime = (start: string, hours: number) => {
    if (!start) return "";
    const [h, m] = start.split(":");
    const endH = parseInt(h) + hours;
    return `${endH.toString().padStart(2, "0")}:${m}`;
  };

  const handleSchedule = async () => {
    if (!clientId || !date || !startTime || !duration) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const hours = parseInt(duration);
      const totalValue = hours * pricePerHour;
      const endTime = calculateEndTime(startTime, hours);

      const { error } = await supabase.from("appointments").insert({
        client_id: clientId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        type: "Aula Presencial",
        status: "Agendado",
        value: totalValue,
        notes: `Aula Presencial 1 a 1 (${hours}h)`
      });

      if (error) throw error;

      toast.success("Aula agendada com sucesso!");
      setIsScheduleModalOpen(false);
      setClientId("");
      setDate("");
      setStartTime("");
      setDuration("1");
    } catch (error) {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar aula");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // FUNÇÕES DE PRODUÇÃO DE CONTEÚDO (CRIAR, EXCLUIR, CHECK-IN, LISTAS)
  // =========================================================================

  const handleCreateContent = async () => {
    if (!newTitle.trim()) {
      toast.error("Informe o título ou ideia do conteúdo");
      return;
    }

    try {
      setLoading(true);
      const initialChecks: StageChecks = {
        ideia: true,
        pre_producao: false,
        captacao: false,
        concluido: false
      };

      const selectedCat =
        newCategory || courseFormats[0]?.name || "Curso Básico";

      const payload = {
        title: newTitle.trim(),
        module_name: newModule === "none" ? "" : newModule.trim(),
        category: selectedCat,
        stage:
          newCaptureItems.length > 0 || newPreItems.length > 0
            ? "Pré-produção"
            : "Ideia",
        idea_notes: newIdeaNotes.trim(),
        pre_production_checklist: newPreItems,
        capture_checklist: newCaptureItems,
        stage_checks: initialChecks
      };

      const { data, error } = await supabase
        .from("content_productions")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      toast.success("Conteúdo adicionado à fila de produção!");
      setIsNewContentModalOpen(false);
      setNewTitle("");
      setNewModule("");
      setNewIdeaNotes("");
      setNewPreItems([]);
      setNewCaptureItems([]);
      setNewPreItemText("");
      setNewCaptureItemText("");
      fetchContents();
      if (data?.id) {
        setSelectedContentId(data.id);
      }
    } catch (error) {
      console.error("Erro ao criar conteúdo:", error);
      toast.error("Não foi possível criar o conteúdo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from("content_productions")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setContents((prev) => prev.filter((item) => item.id !== id));
      if (selectedContentId === id) {
        setSelectedContentId(null);
      }
      toast.success("Conteúdo excluído");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir conteúdo");
    }
  };

  const handleToggleStageCheck = async (
    item: ContentProduction,
    key: keyof StageChecks,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();

    const updatedChecks: StageChecks = {
      ...item.stage_checks,
      [key]: !item.stage_checks[key]
    };

    let nextStage: ContentProduction["stage"] = item.stage;
    if (key === "concluido" && updatedChecks.concluido) {
      updatedChecks.ideia = true;
      updatedChecks.pre_producao = true;
      updatedChecks.captacao = true;
      nextStage = "Concluído";
    } else if (key === "captacao" && updatedChecks.captacao) {
      updatedChecks.ideia = true;
      updatedChecks.pre_producao = true;
      nextStage = updatedChecks.concluido ? "Concluído" : "Captação";
    } else if (key === "pre_producao" && updatedChecks.pre_producao) {
      updatedChecks.ideia = true;
      nextStage = "Captação";
    } else {
      if (updatedChecks.concluido) nextStage = "Concluído";
      else if (updatedChecks.captacao) nextStage = "Captação";
      else if (updatedChecks.pre_producao) nextStage = "Captação";
      else if (updatedChecks.ideia) nextStage = "Pré-produção";
      else nextStage = "Ideia";
    }

    try {
      setContents((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, stage_checks: updatedChecks, stage: nextStage }
            : c
        )
      );

      const { error } = await supabase
        .from("content_productions")
        .update({
          stage_checks: updatedChecks,
          stage: nextStage,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Check-in atualizado");
    } catch (error) {
      console.error("Erro ao atualizar check-in:", error);
      toast.error("Erro ao salvar check-in");
      fetchContents();
    }
  };

  const handleStageSelectChange = async (
    item: ContentProduction,
    newStage: ContentProduction["stage"]
  ) => {
    const updatedChecks: StageChecks = {
      ideia: true,
      pre_producao:
        newStage === "Captação" || newStage === "Concluído"
          ? true
          : item.stage_checks.pre_producao,
      captacao:
        newStage === "Concluído" ? true : item.stage_checks.captacao,
      concluido: newStage === "Concluído"
    };

    try {
      setContents((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, stage: newStage, stage_checks: updatedChecks }
            : c
        )
      );

      const { error } = await supabase
        .from("content_productions")
        .update({
          stage: newStage,
          stage_checks: updatedChecks,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
      toast.success(`Etapa alterada para ${newStage}`);
    } catch (error) {
      console.error("Erro ao mudar etapa:", error);
      toast.error("Erro ao mudar etapa");
      fetchContents();
    }
  };

  const handleToggleChecklistItem = async (
    item: ContentProduction,
    listType: "pre_production_checklist" | "capture_checklist",
    checkId: string
  ) => {
    const currentList = item[listType] || [];
    const updatedList = currentList.map((entry) =>
      entry.id === checkId ? { ...entry, done: !entry.done } : entry
    );

    const allDone =
      updatedList.length > 0 && updatedList.every((entry) => entry.done);
    const updatedStageChecks = { ...item.stage_checks };
    let nextStage = item.stage;

    if (listType === "pre_production_checklist" && allDone) {
      updatedStageChecks.pre_producao = true;
      if (nextStage === "Ideia" || nextStage === "Pré-produção") {
        nextStage = "Captação";
      }
    }
    if (listType === "capture_checklist" && allDone) {
      updatedStageChecks.captacao = true;
    }

    try {
      setContents((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                [listType]: updatedList,
                stage_checks: updatedStageChecks,
                stage: nextStage
              }
            : c
        )
      );

      const { error } = await supabase
        .from("content_productions")
        .update({
          [listType]: updatedList,
          stage_checks: updatedStageChecks,
          stage: nextStage,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar check-in");
      fetchContents();
    }
  };

  const handleAddChecklistItem = async (
    item: ContentProduction,
    listType: "pre_production_checklist" | "capture_checklist",
    text: string
  ) => {
    if (!text.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false
    };

    const updatedList = [...(item[listType] || []), newItem];

    try {
      setContents((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, [listType]: updatedList } : c
        )
      );

      if (listType === "pre_production_checklist") setDetailPreInput("");
      else setDetailCaptureInput("");

      const { error } = await supabase
        .from("content_productions")
        .update({
          [listType]: updatedList,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      toast.error("Erro ao adicionar item na lista");
      fetchContents();
    }
  };

  const handleRemoveChecklistItem = async (
    item: ContentProduction,
    listType: "pre_production_checklist" | "capture_checklist",
    checkId: string
  ) => {
    const updatedList = (item[listType] || []).filter(
      (entry) => entry.id !== checkId
    );

    try {
      setContents((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, [listType]: updatedList } : c
        )
      );

      const { error } = await supabase
        .from("content_productions")
        .update({
          [listType]: updatedList,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast.error("Erro ao remover item");
      fetchContents();
    }
  };

  const handleSaveContentInfo = async (
    overrideCategory?: string,
    overrideModule?: string
  ) => {
    if (!selectedContent || !editingTitle.trim()) return;

    const finalCategory =
      overrideCategory !== undefined ? overrideCategory : editingCategory;
    const finalModule =
      overrideModule !== undefined
        ? overrideModule === "none"
          ? ""
          : overrideModule
        : editingModule === "none"
        ? ""
        : editingModule;

    try {
      setContents((prev) =>
        prev.map((c) =>
          c.id === selectedContent.id
            ? {
                ...c,
                title: editingTitle.trim(),
                module_name: finalModule.trim(),
                category: finalCategory,
                idea_notes: editingNotes.trim()
              }
            : c
        )
      );

      const { error } = await supabase
        .from("content_productions")
        .update({
          title: editingTitle.trim(),
          module_name: finalModule.trim(),
          category: finalCategory,
          idea_notes: editingNotes.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedContent.id);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar detalhes:", error);
      toast.error("Erro ao salvar alterações");
    }
  };

  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      const matchesStage =
        stageFilter === "all" || c.stage === stageFilter;
      const matchesSearch =
        c.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
        (c.module_name || "").toLowerCase().includes(contentSearch.toLowerCase()) ||
        (c.category || "").toLowerCase().includes(contentSearch.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [contents, stageFilter, contentSearch]);

  const getStageBadgeClass = (stage: ContentProduction["stage"]) => {
    switch (stage) {
      case "Ideia":
        return "bg-muted text-muted-foreground border-border";
      case "Pré-produção":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Captação":
        return "bg-primary/10 text-primary border-primary/20";
      case "Concluído":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Padrão Seguindo as Regras (.cursorrules) */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Cursos Luizart</h1>
          <p className="page-subtitle">
            Gestão de aulas presenciais 1 a 1, produção de conteúdo e plataforma online.
          </p>
        </div>

        {activeTab === "producao" && (
          <Button
            className="h-11 gap-2 px-5 shadow-sm"
            onClick={() => {
              if (!newCategory && courseFormats.length > 0) {
                setNewCategory(courseFormats[0].name);
              }
              setIsNewContentModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Conteúdo
          </Button>
        )}

        {activeTab === "configuracoes" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="h-11 gap-2 px-4"
              onClick={openNewModuleModal}
            >
              <Plus className="h-4 w-4" />
              Novo Módulo / Tema
            </Button>
            <Button
              className="h-11 gap-2 px-5 shadow-sm"
              onClick={openNewFormatModal}
            >
              <Plus className="h-4 w-4" />
              Novo Curso / Formato
            </Button>
          </div>
        )}

        {activeTab === "presencial" && (
          <Button
            className="h-11 gap-2 px-5 shadow-sm"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Agendar Aula
          </Button>
        )}
      </div>

      {/* Abas de Navegação Sempre Abaixo do Cabeçalho */}
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          <TabsList className="bg-transparent space-x-2 p-0 h-auto w-max min-w-full sm:min-w-0">
            <TabsTrigger
              value="presencial"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Users className="w-4 h-4 mr-2" />
              Aulas Individuais
            </TabsTrigger>
            <TabsTrigger
              value="producao"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Clapperboard className="w-4 h-4 mr-2" />
              Bastidores (Produção)
            </TabsTrigger>
            <TabsTrigger
              value="configuracoes"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger
              value="online"
              className="rounded-full px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-accent/50 text-foreground border shadow-sm transition-all text-sm font-medium whitespace-nowrap"
            >
              <Globe className="w-4 h-4 mr-2" />
              Plataforma Online
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          {/* =========================================================
              ABA 1: AULAS PRESENCIAIS (1 A 1)
             ========================================================= */}
          <TabsContent value="presencial" className="m-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clients
                .filter((c) => c.is_student)
                .map((student) => (
                  <div
                    key={student.id}
                    className="bg-card rounded-2xl border shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-[250px] relative group hover:border-primary/50 transition-colors"
                  >
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          try {
                            await supabase
                              .from("clientes")
                              .update({ is_student: false })
                              .eq("id", student.id);
                            toast.success("Aluno removido.");
                            fetchClients();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 overflow-hidden">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground line-clamp-1">
                      {student.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {student.phone}
                    </p>

                    <div className="mt-6 w-full flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-xs h-10"
                        onClick={() => {
                          setClientId(student.id);
                          setIsScheduleModalOpen(true);
                        }}
                      >
                        Agendar Aula
                      </Button>
                    </div>
                  </div>
                ))}

              <div
                onClick={() => setIsRegisterStudentModalOpen(true)}
                className="bg-card rounded-2xl border shadow-sm p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[250px] border-dashed border-2 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    Novo Aluno Presencial
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vincular cliente do CRM
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* =========================================================
              ABA 2: BASTIDORES (PRODUÇÃO DE CONTEÚDO)
             ========================================================= */}
          <TabsContent value="producao" className="m-0 space-y-4">
            {/* Barra de Filtros e Pesquisa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ideia, curso ou módulo..."
                  className="pl-9 h-11"
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                <Button
                  variant={stageFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-9 rounded-lg text-xs font-medium shrink-0"
                  onClick={() => setStageFilter("all")}
                >
                  Todos ({contents.length})
                </Button>
                {STAGES.map((stage) => {
                  const count = contents.filter((c) => c.stage === stage).length;
                  return (
                    <Button
                      key={stage}
                      variant={stageFilter === stage ? "default" : "outline"}
                      size="sm"
                      className="h-9 rounded-lg text-xs font-medium shrink-0"
                      onClick={() => setStageFilter(stage)}
                    >
                      {stage} ({count})
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-lg text-xs font-medium shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setActiveTab("configuracoes")}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Cursos & Módulos
                </Button>
              </div>
            </div>

            {/* Tabela de Produção de Conteúdo */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="min-w-[220px]">Conteúdo / Ideia</TableHead>
                      <TableHead className="min-w-[140px]">Etapa Atual</TableHead>
                      <TableHead className="min-w-[260px]">Check-in de Etapas</TableHead>
                      <TableHead className="min-w-[150px]">Pré-produção</TableHead>
                      <TableHead className="min-w-[160px]">Captação de Material</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingContents ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                          Carregando conteúdos...
                        </TableCell>
                      </TableRow>
                    ) : filteredContents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Clapperboard className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-foreground">
                              Nenhum conteúdo na lista
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1 h-9 gap-1.5"
                              onClick={() => setIsNewContentModalOpen(true)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Criar Conteúdo
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContents.map((item) => {
                        const preTotal = item.pre_production_checklist?.length || 0;
                        const preDone = (item.pre_production_checklist || []).filter(
                          (i) => i.done
                        ).length;

                        const capTotal = item.capture_checklist?.length || 0;
                        const capDone = (item.capture_checklist || []).filter(
                          (i) => i.done
                        ).length;

                        return (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setSelectedContentId(item.id)}
                          >
                            {/* Coluna 1: Ideia / Conteúdo */}
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-foreground leading-snug">
                                  {item.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.category && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] font-medium px-2 py-0"
                                    >
                                      {item.category}
                                    </Badge>
                                  )}
                                  {item.module_name && (
                                    <span className="text-xs text-muted-foreground">
                                      • {item.module_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Coluna 2: Etapa Atual */}
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={item.stage}
                                onValueChange={(val) =>
                                  handleStageSelectChange(
                                    item,
                                    val as ContentProduction["stage"]
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={`h-8 text-xs font-semibold w-[135px] border ${getStageBadgeClass(
                                    item.stage
                                  )}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STAGES.map((st) => (
                                    <SelectItem key={st} value={st} className="text-xs">
                                      {st}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            {/* Coluna 3: Botões de Check-in Rápido por Etapa */}
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(
                                  [
                                    { key: "ideia", label: "Ideia" },
                                    { key: "pre_producao", label: "Pré-prod." },
                                    { key: "captacao", label: "Captação" },
                                    { key: "concluido", label: "Pronto" }
                                  ] as const
                                ).map((st) => {
                                  const checked = !!item.stage_checks?.[st.key];
                                  return (
                                    <button
                                      key={st.key}
                                      type="button"
                                      onClick={(e) =>
                                        handleToggleStageCheck(item, st.key, e)
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                                        checked
                                          ? "bg-primary/10 text-primary border-primary/30"
                                          : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                                      }`}
                                    >
                                      <div
                                        className={`h-3.5 w-3.5 rounded-sm flex items-center justify-center ${
                                          checked
                                            ? "bg-primary text-primary-foreground"
                                            : "border border-muted-foreground/40"
                                        }`}
                                      >
                                        {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                      </div>
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </TableCell>

                            {/* Coluna 4: Progresso Pré-produção */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{
                                      width: `${
                                        preTotal > 0
                                          ? Math.round((preDone / preTotal) * 100)
                                          : item.stage_checks?.pre_producao
                                          ? 100
                                          : 0
                                      }%`
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  {preDone}/{preTotal}
                                </span>
                              </div>
                            </TableCell>

                            {/* Coluna 5: Progresso Lista de Captação */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{
                                      width: `${
                                        capTotal > 0
                                          ? Math.round((capDone / capTotal) * 100)
                                          : item.stage_checks?.captacao
                                          ? 100
                                          : 0
                                      }%`
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-foreground">
                                  {capDone}/{capTotal} takes
                                </span>
                              </div>
                            </TableCell>

                            {/* Coluna 6: Ações */}
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5"
                                  onClick={() => setSelectedContentId(item.id)}
                                >
                                  <ListChecks className="h-3.5 w-3.5" />
                                  Check-in
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => handleDeleteContent(item.id, e)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* =========================================================
              ABA 3: CONFIGURAÇÕES (CURSOS / FORMATOS & MÓDULOS / TEMAS)
             ========================================================= */}
          <TabsContent value="configuracoes" className="m-0 space-y-6">
            {/* Bloco 1: Cursos / Formatos */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">
                    Cursos & Formatos
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs"
                  onClick={openNewFormatModal}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Cadastrar Curso / Formato
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="min-w-[180px]">Curso / Formato</TableHead>
                      <TableHead className="min-w-[120px]">Acesso</TableHead>
                      <TableHead className="min-w-[220px]">Público-Alvo (Para quem é)</TableHead>
                      <TableHead className="min-w-[260px]">Funcionalidade / Descrição</TableHead>
                      <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseFormats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                          Nenhum curso ou formato cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      courseFormats.map((format) => (
                        <TableRow key={format.id}>
                          <TableCell className="font-bold text-sm text-foreground">
                            {format.name}
                          </TableCell>
                          <TableCell>
                            {format.is_paid ? (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20 text-xs"
                              >
                                Pago
                                {format.base_price > 0
                                  ? ` • R$ ${format.base_price.toFixed(0)}`
                                  : ""}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                Gratuito
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {format.target_audience || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => openEditFormatModal(format)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteFormat(format.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Bloco 2: Módulos e Temas */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">
                    Módulos & Temas
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs"
                  onClick={openNewModuleModal}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Cadastrar Módulo / Tema
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="min-w-[200px]">Módulo / Tema</TableHead>
                      <TableHead className="min-w-[180px]">Curso / Formato Vinculado</TableHead>
                      <TableHead className="min-w-[280px]">Descrição</TableHead>
                      <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseModules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                          Nenhum módulo ou tema cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      courseModules.map((mod) => {
                        const linkedCourse = courseFormats.find(
                          (f) => f.id === mod.course_id
                        );
                        return (
                          <TableRow key={mod.id}>
                            <TableCell className="font-bold text-sm text-foreground">
                              {mod.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {linkedCourse ? linkedCourse.name : "Geral / Todos"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {mod.description || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => openEditModuleModal(mod)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteModule(mod.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* =========================================================
              ABA 4: PLATAFORMA ONLINE
             ========================================================= */}
          <TabsContent value="online" className="m-0 space-y-6">
            <div className="bg-card rounded-2xl border shadow-sm p-12 text-center space-y-5">
              <div className="h-20 w-20 mx-auto rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center relative overflow-hidden group">
                <Hammer className="h-10 w-10 relative z-10 animate-bounce" />
              </div>

              <h3 className="text-2xl font-bold text-foreground">
                Plataforma Online em Construção
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto text-base">
                Espaço reservado para integração da área de membros e reprodutor de aulas.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* =========================================================
          MODAL: CADASTRAR / EDITAR CURSO OU FORMATO
         ========================================================= */}
      <Dialog open={isFormatModalOpen} onOpenChange={setIsFormatModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFormatId ? "Editar Curso / Formato" : "Novo Curso / Formato"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Curso / Formato</Label>
              <Input
                className="h-11"
                placeholder="Ex: Curso Básico"
                value={formatName}
                onChange={(e) => setFormatName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Acesso</Label>
                <Select
                  value={formatIsPaid}
                  onValueChange={(v) => setFormatIsPaid(v as "paid" | "free")}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="free">Gratuito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formatIsPaid === "paid" && (
                <div className="space-y-1.5">
                  <Label>Valor Base (R$)</Label>
                  <Input
                    type="number"
                    className="h-11"
                    placeholder="Ex: 497"
                    value={formatPrice}
                    onChange={(e) => setFormatPrice(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Para quem é (Público-Alvo)</Label>
              <Input
                className="h-11"
                placeholder="Ex: Iniciantes do zero que buscam dominar a máquina"
                value={formatAudience}
                onChange={(e) => setFormatAudience(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição / Funcionalidade do Curso</Label>
              <Textarea
                rows={3}
                placeholder="Descreva a proposta, entregas e funcionamento deste curso..."
                value={formatDescription}
                onChange={(e) => setFormatDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setIsFormatModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-11"
              onClick={handleSaveFormat}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Curso / Formato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: CADASTRAR / EDITAR MÓDULO OU TEMA
         ========================================================= */}
      <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editingModuleId ? "Editar Módulo / Tema" : "Novo Módulo / Tema"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Curso / Formato Vinculado</Label>
              <Select value={moduleCourseId} onValueChange={setModuleCourseId}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Geral (Todos os Cursos)</SelectItem>
                  {courseFormats.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nome do Módulo / Tema</Label>
              <Input
                className="h-11"
                placeholder="Ex: Módulo 01 - Fundamentos"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição do Módulo</Label>
              <Textarea
                rows={3}
                placeholder="O que será abordado neste módulo ou tema..."
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setIsModuleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-11"
              onClick={handleSaveModule}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Módulo / Tema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: CRIAR NOVO CONTEÚDO (DESDE A IDEIA ATÉ CAPTAÇÃO)
         ========================================================= */}
      <Dialog open={isNewContentModalOpen} onOpenChange={setIsNewContentModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Conteúdo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Ideia / Título do Conteúdo</Label>
              <Input
                className="h-11"
                placeholder="Ex: Aula 03 - Como regular a voltagem para traço fino"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Curso / Formato</Label>
                  <button
                    type="button"
                    className="text-xs text-primary font-medium hover:underline"
                    onClick={openNewFormatModal}
                  >
                    + Cadastrar
                  </button>
                </div>
                <Select
                  value={newCategory}
                  onValueChange={(val) => {
                    setNewCategory(val);
                    setNewModule("");
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o curso/formato" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseFormats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name} ({cat.is_paid ? "Pago" : "Gratuito"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Módulo / Tema</Label>
                  <button
                    type="button"
                    className="text-xs text-primary font-medium hover:underline"
                    onClick={openNewModuleModal}
                  >
                    + Cadastrar
                  </button>
                </div>
                <Select value={newModule || "none"} onValueChange={setNewModule}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o módulo/tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem módulo específico</SelectItem>
                    {availableModulesForNewContent.map((mod) => (
                      <SelectItem key={mod.id} value={mod.name}>
                        {mod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Rascunho da Ideia / Roteiro</Label>
              <Textarea
                rows={2}
                placeholder="Pontos principais que precisam ser falados neste conteúdo..."
                value={newIdeaNotes}
                onChange={(e) => setNewIdeaNotes(e.target.value)}
              />
            </div>

            {/* Pré-produção inicial */}
            <div className="space-y-2 pt-1 border-t">
              <Label>Checklist de Pré-produção</Label>
              <div className="flex gap-2">
                <Input
                  className="h-11"
                  placeholder="Ex: Separar pele artificial e bancada..."
                  value={newPreItemText}
                  onChange={(e) => setNewPreItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPreItemText.trim()) {
                      e.preventDefault();
                      setNewPreItems((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          text: newPreItemText.trim(),
                          done: false
                        }
                      ]);
                      setNewPreItemText("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 px-4 shrink-0"
                  onClick={() => {
                    if (!newPreItemText.trim()) return;
                    setNewPreItems((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        text: newPreItemText.trim(),
                        done: false
                      }
                    ]);
                    setNewPreItemText("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {newPreItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {newPreItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border bg-muted/20 text-sm"
                    >
                      <span>{item.text}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setNewPreItems((prev) =>
                            prev.filter((i) => i.id !== item.id)
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Captação de Material inicial */}
            <div className="space-y-2 pt-1 border-t">
              <Label>Lista de Captação de Material (Takes / Cenas)</Label>
              <div className="flex gap-2">
                <Input
                  className="h-11"
                  placeholder="Ex: Gravar close-up regulando a agulha..."
                  value={newCaptureItemText}
                  onChange={(e) => setNewCaptureItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCaptureItemText.trim()) {
                      e.preventDefault();
                      setNewCaptureItems((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          text: newCaptureItemText.trim(),
                          done: false
                        }
                      ]);
                      setNewCaptureItemText("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 px-4 shrink-0"
                  onClick={() => {
                    if (!newCaptureItemText.trim()) return;
                    setNewCaptureItems((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        text: newCaptureItemText.trim(),
                        done: false
                      }
                    ]);
                    setNewCaptureItemText("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {newCaptureItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {newCaptureItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border bg-muted/20 text-sm"
                    >
                      <span>{item.text}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setNewCaptureItems((prev) =>
                            prev.filter((i) => i.id !== item.id)
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setIsNewContentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-11"
              onClick={handleCreateContent}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Conteúdo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: GERENCIAR CONTEÚDO, PRÉ-PRODUÇÃO E CHECK-IN DE CAPTAÇÃO
         ========================================================= */}
      <Dialog
        open={!!selectedContent}
        onOpenChange={(open) => !open && setSelectedContentId(null)}
      >
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <DialogTitle className="text-lg font-bold">
                    Produção & Check-in de Material
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={getStageBadgeClass(selectedContent.stage)}
                  >
                    {selectedContent.stage}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Check-in Geral de Etapas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: "ideia", label: "1. Ideia" },
                      { key: "pre_producao", label: "2. Pré-produção" },
                      { key: "captacao", label: "3. Captação" },
                      { key: "concluido", label: "4. Concluído" }
                    ] as const
                  ).map((st) => {
                    const isChecked = !!selectedContent.stage_checks?.[st.key];
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() =>
                          handleToggleStageCheck(selectedContent, st.key)
                        }
                        className={`h-11 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted/20 border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <span>{st.label}</span>
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center ${
                            isChecked
                              ? "bg-primary text-primary-foreground"
                              : "border border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dados da Ideia / Conteúdo */}
                <div className="space-y-3 bg-muted/20 p-4 rounded-xl border">
                  <div className="space-y-1">
                    <Label className="text-xs">Título / Ideia</Label>
                    <Input
                      className="h-11 bg-background"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveContentInfo()}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Curso / Formato</Label>
                      <Select
                        value={editingCategory}
                        onValueChange={(val) => {
                          setEditingCategory(val);
                          handleSaveContentInfo(val, editingModule);
                        }}
                      >
                        <SelectTrigger className="h-11 bg-background">
                          <SelectValue placeholder="Selecione o curso/formato" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseFormats.map((f) => (
                            <SelectItem key={f.id} value={f.name}>
                              {f.name} ({f.is_paid ? "Pago" : "Gratuito"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Módulo / Tema</Label>
                      <Select
                        value={editingModule || "none"}
                        onValueChange={(val) => {
                          setEditingModule(val === "none" ? "" : val);
                          handleSaveContentInfo(editingCategory, val);
                        }}
                      >
                        <SelectTrigger className="h-11 bg-background">
                          <SelectValue placeholder="Selecione o módulo/tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem módulo específico</SelectItem>
                          {availableModulesForEditingContent.map((m) => (
                            <SelectItem key={m.id} value={m.name}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Roteiro / Rascunho da Ideia</Label>
                    <Textarea
                      rows={2}
                      className="bg-background"
                      placeholder="Anotações do roteiro..."
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      onBlur={() => handleSaveContentInfo()}
                    />
                  </div>
                </div>

                {/* ETAPA: PRÉ-PRODUÇÃO */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Etapa de Pré-produção
                    </h4>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {
                        (selectedContent.pre_production_checklist || []).filter(
                          (i) => i.done
                        ).length
                      }
                      /{selectedContent.pre_production_checklist?.length || 0} concluídos
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      className="h-11"
                      placeholder="Adicionar item de pré-produção..."
                      value={detailPreInput}
                      onChange={(e) => setDetailPreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChecklistItem(
                            selectedContent,
                            "pre_production_checklist",
                            detailPreInput
                          );
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="h-11 px-4 shrink-0"
                      onClick={() =>
                        handleAddChecklistItem(
                          selectedContent,
                          "pre_production_checklist",
                          detailPreInput
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    {(selectedContent.pre_production_checklist || []).map(
                      (checkItem) => (
                        <div
                          key={checkItem.id}
                          onClick={() =>
                            handleToggleChecklistItem(
                              selectedContent,
                              "pre_production_checklist",
                              checkItem.id
                            )
                          }
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            checkItem.done
                              ? "bg-muted/40 border-border text-muted-foreground"
                              : "bg-card border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                checkItem.done
                                  ? "bg-primary text-primary-foreground"
                                  : "border-2 border-muted-foreground/40"
                              }`}
                            >
                              {checkItem.done && (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                checkItem.done ? "line-through" : ""
                              }`}
                            >
                              {checkItem.text}
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveChecklistItem(
                                selectedContent,
                                "pre_production_checklist",
                                checkItem.id
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* ETAPA: LISTA DE CAPTAÇÃO DE MATERIAL */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Clapperboard className="h-4 w-4 text-primary" />
                      Lista de Captação de Material (Takes / Gravações)
                    </h4>
                    <span className="text-xs font-semibold text-primary">
                      {
                        (selectedContent.capture_checklist || []).filter(
                          (i) => i.done
                        ).length
                      }
                      /{selectedContent.capture_checklist?.length || 0} captados
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      className="h-11"
                      placeholder="Ex: Gravar de cima aplicando o decalque..."
                      value={detailCaptureInput}
                      onChange={(e) => setDetailCaptureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChecklistItem(
                            selectedContent,
                            "capture_checklist",
                            detailCaptureInput
                          );
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="h-11 px-4 shrink-0"
                      onClick={() =>
                        handleAddChecklistItem(
                          selectedContent,
                          "capture_checklist",
                          detailCaptureInput
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    {(selectedContent.capture_checklist || []).map(
                      (capItem) => (
                        <div
                          key={capItem.id}
                          onClick={() =>
                            handleToggleChecklistItem(
                              selectedContent,
                              "capture_checklist",
                              capItem.id
                            )
                          }
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            capItem.done
                              ? "bg-primary/5 border-primary/20 text-muted-foreground"
                              : "bg-card border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                capItem.done
                                  ? "bg-primary text-primary-foreground"
                                  : "border-2 border-muted-foreground/40"
                              }`}
                            >
                              {capItem.done && (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                capItem.done ? "line-through" : ""
                              }`}
                            >
                              {capItem.text}
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveChecklistItem(
                                selectedContent,
                                "capture_checklist",
                                capItem.id
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  onClick={() => handleDeleteContent(selectedContent.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Conteúdo
                </Button>
                <Button
                  type="button"
                  className="h-11"
                  onClick={() => {
                    handleSaveContentInfo();
                    setSelectedContentId(null);
                  }}
                >
                  Concluir e Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: REGISTRAR ALUNO PRESENCIAL
         ========================================================= */}
      <Dialog
        open={isRegisterStudentModalOpen}
        onOpenChange={setIsRegisterStudentModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Aluno Presencial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar Cliente no CRM</Label>
              <Input
                className="h-11"
                placeholder="Nome do cliente..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto space-y-2 border rounded-md p-2">
              {clients
                .filter((c) => !c.is_student)
                .filter((c) =>
                  c.name.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from("clientes")
                          .update({ is_student: true })
                          .eq("id", client.id);
                        if (error) throw error;
                        toast.success("Aluno registrado com sucesso!");
                        setIsRegisterStudentModalOpen(false);
                        fetchClients();
                      } catch (e) {
                        console.error(e);
                        toast.error("Erro ao registrar aluno.");
                      }
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.phone}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 text-xs">
                      Registrar
                    </Button>
                  </div>
                ))}
              {clients.filter((c) => !c.is_student).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum cliente disponível.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          MODAL: AGENDAR AULA INDIVIDUAL
         ========================================================= */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Aula Individual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Aluno</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {clients
                    .filter((c) => c.is_student)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9 h-11"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    className="pl-9 h-11"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Duração (Horas)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hora (R$ 50)</SelectItem>
                  <SelectItem value="2">2 Horas (R$ 100)</SelectItem>
                  <SelectItem value="3">3 Horas (R$ 150)</SelectItem>
                  <SelectItem value="4">4 Horas (R$ 200)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-accent/30 p-3 rounded-lg flex items-center justify-between border mt-2">
              <span className="text-sm font-medium">Valor Total:</span>
              <span className="text-lg font-bold text-primary">
                R$ {(parseInt(duration) * 50).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-11"
              onClick={handleSchedule}
              disabled={loading}
            >
              {loading ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
