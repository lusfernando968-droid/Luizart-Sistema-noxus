import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign, ChevronLeft, ChevronRight, FileText, Banknote, Calendar, RefreshCw, Activity, Trash2, Link as LinkIcon, ExternalLink, FileCheck, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, supabasePublic } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FiscalShieldCard } from "@/components/financial/FiscalShieldCard";
import { ReceiptGeneratorModal } from "@/components/financial/ReceiptGeneratorModal";
import { TaxReportModal } from "@/components/financial/TaxReportModal";
import { FinancialRegistry } from "@/components/financial/FinancialRegistry";
import { FileSpreadsheet, LineChart } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  value: number;
  date: string;
  type: "entrada" | "saida";
  status: string;
  driveLink?: string;
  isDeductible?: boolean;
}

const Financial = () => {
  const [tab, setTab] = useState<"all" | "entrada" | "saida">("all");
  const [activeTab, setActiveTab] = useState("fluxo");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Regime Tributário do Usuário (salvo no localStorage)
  const [userRegime, setUserRegime] = useState<"MEI" | "CPF" | "SIMPLES">(() => {
    return (localStorage.getItem("noxus_user_regime") as "MEI" | "CPF" | "SIMPLES") || "MEI";
  });
  const [regimeModalOpen, setRegimeModalOpen] = useState(false);

  // Modais Fiscais
  const [taxReportOpen, setTaxReportOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    value: 0,
    date: new Date().toISOString().split("T")[0],
    type: "entrada" as "entrada" | "saida",
    status: "Pago",
    driveLink: "",
    isDeductible: false
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false });
      
      if (error) throw error;
      
      const formatted = (data || []).map((t: any) => ({
        id: t.id,
        description: t.description,
        value: Number(t.value) || 0,
        date: typeof t.date === 'string' && t.date.includes('-') ? t.date.substring(0, 10).split('-').reverse().join('/') : String(t.date || ''),
        type: t.type as "entrada" | "saida",
        status: t.status,
        driveLink: t.driveLink || t.drive_link,
        isDeductible: t.isDeductible || t.is_deductible
      }));
      
      setTransactions(formatted);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(`Erro: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSaveTransaction = async () => {
    try {
      if (!formData.description) {
        toast.error("A descrição é obrigatória");
        return;
      }
      if (formData.value <= 0) {
        toast.error("O valor deve ser maior que zero");
        return;
      }

      const token = localStorage.getItem("noxus_token");
      if (!token) {
        toast.error("Você precisa estar logado.");
        return;
      }

      const payload = {
        description: formData.description,
        value: formData.value,
        date: formData.date,
        type: formData.type,
        status: formData.status,
        drive_link: formData.driveLink,
        is_deductible: formData.isDeductible
      };

      const { error } = await supabase.from('financial_transactions').insert([payload]);
      if (error) throw error;

      toast.success("Transação salva com sucesso!");
      setModalOpen(false);
      setFormData({
        description: "",
        value: 0,
        date: new Date().toISOString().split("T")[0],
        type: "entrada",
        status: "Pago",
        driveLink: "",
        isDeductible: false
      });
      fetchTransactions();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Erro ao salvar a transação.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta transação?")) return;
    try {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
      toast.success("Transação excluída!");
      fetchTransactions();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir transação.");
    }
  };

  const handleSaveRegime = (regime: "MEI" | "CPF" | "SIMPLES") => {
    setUserRegime(regime);
    localStorage.setItem("noxus_user_regime", regime);
    setRegimeModalOpen(false);
    toast.success(`Regime tributário atualizado para ${regime}!`);
  };

  const handleOpenReceipt = (t: Transaction) => {
    setReceiptTransaction(t);
    setReceiptModalOpen(true);
  };

  // Cálculos Anuais de Faturamento para o Termômetro do MEI
  const annualRevenue = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== "entrada") return false;
        const parts = t.date.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[2], 10);
          return year === selectedYear;
        }
        return true;
      })
      .reduce((sum, t) => sum + t.value, 0);
  }, [transactions, selectedYear]);

  // Filtros Mensais para a Tabela
  const filteredByDate = transactions.filter((t) => {
    const parts = t.date.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return month === selectedMonth && year === selectedYear;
    }
    return true;
  });

  const filtered = tab === "all" ? filteredByDate : filteredByDate.filter((t) => t.type === tab);
  const totalEntradas = filteredByDate.filter((t) => t.type === "entrada").reduce((s, t) => s + t.value, 0);
  const totalSaidas = filteredByDate.filter((t) => t.type === "saida").reduce((s, t) => s + t.value, 0);
  const saldo = totalEntradas - totalSaidas;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Financeiro & Proteção Fiscal</h1>
          <p className="page-subtitle">Controle de fluxo de caixa, recibos e blindagem do Imposto de Renda</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 inline-flex w-max">
          <TabsTrigger value="fluxo" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <LineChart className="w-3.5 h-3.5" /> Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="registro" className="rounded-sm flex items-center gap-2 text-xs font-semibold px-4">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Registros & Métricas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fluxo" className="m-0 space-y-6">
          {/* Card de Blindagem & Inteligência Fiscal (Termômetro MEI) */}
      <Accordion type="single" collapsible className="w-full bg-card rounded-xl border px-4 shadow-sm">
        <AccordionItem value="fiscal-shield" className="border-none">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base">Painel de Proteção Fiscal</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 pb-2">
              <FiscalShieldCard
                annualRevenue={annualRevenue}
                meiLimit={81000}
                userRegime={userRegime}
                onOpenTaxReport={() => setTaxReportOpen(true)}
                onOpenRegimeModal={() => setRegimeModalOpen(true)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Cards Mensais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entradas no Mês</p>
              <p className="text-xl font-bold text-foreground">R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2.5">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saídas no Mês</p>
              <p className="text-xl font-bold text-foreground">R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Lucro Líquido</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
                R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
          <div className="flex items-center gap-1">
            {(["all", "entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
              >
                {t === "all" ? "Todas" : t === "entrada" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center capitalize">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground font-medium">Carregando transações...</div>
          ) : filtered.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-accent/30 text-left">
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Comprovante Drive</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Valor</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{t.description}</span>
                        {t.isDeductible && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary dark:text-primary border-primary/20">
                            Livro Caixa (Dedutível)
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{t.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === "entrada" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        }`}>
                        {t.type === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {t.driveLink ? (
                        <a
                          href={t.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-primary text-xs font-medium hover:underline"
                        >
                          <LinkIcon className="w-3 h-3 text-primary" />
                          <span>Ver Drive</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">-</span>
                      )}
                    </td>
                    <td className={`p-4 text-sm text-right font-bold ${t.type === "entrada" ? "text-primary" : "text-destructive"
                      }`}>
                      {t.type === "entrada" ? "+" : "-"} R$ {t.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.type === "entrada" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReceipt(t)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                            title="Emitir Recibo"
                          >
                            <FileCheck className="h-3.5 w-3.5 text-primary" />
                            <span>Recibo</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transação encontrada neste período.</div>
          )}
        </div>
      </div>
      </TabsContent>

      <TabsContent value="registro" className="m-0">
        <FinancialRegistry transactions={transactions} />
      </TabsContent>
      </Tabs>

      {/* Transaction Modal (Com suporte a Link do Google Drive e Livro Caixa) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova Transação Financeira</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div>
              <Label className="flex items-center gap-1.5 text-xs"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Sessão Tatuagem Braço, Tintas Electric Ink, Aluguel..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1.5 text-xs"><Banknote className="w-3.5 h-3.5 text-muted-foreground" /> Valor</Label>
                <CurrencyInput
                  value={formData.value || 0}
                  onChange={(val) => setFormData({ ...formData, value: val })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-xs"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1.5 text-xs"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /> Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: "entrada" | "saida") => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                    <SelectItem value="saida">Saída (Despesa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-xs"><Activity className="w-3.5 h-3.5 text-muted-foreground" /> Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campo de Link do Google Drive */}
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <LinkIcon className="w-3.5 h-3.5 text-primary" /> Link do Comprovante (Google Drive / Nuvem)
              </Label>
              <Input
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                placeholder="Cole aqui o link do Google Drive (ex: https://drive.google.com/...)"
                className="mt-1 text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Cole o link compartilhado da foto do recibo/nota no Google Drive para guardar com 0 bytes de banco.
              </p>
            </div>

            {/* Checkbox de Livro Caixa Dedutível (Apenas para Saídas) */}
            {formData.type === "saida" && (
              <div className="flex items-start space-x-2 pt-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                <Checkbox
                  id="isDeductible"
                  checked={formData.isDeductible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDeductible: Boolean(checked) })}
                  className="mt-0.5"
                />
                <div className="grid gap-1 leading-none">
                  <label htmlFor="isDeductible" className="text-xs font-semibold text-primary dark:text-primary cursor-pointer">
                    Despesa Dedutível do Imposto de Renda (Livro Caixa)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Marque se esta despesa for de insumos (tintas, agulhas), aluguel do estúdio, luz ou cursos para abater do Imposto de Renda.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTransaction}>Salvar Transação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Escolha do Regime Tributário */}
      <Dialog open={regimeModalOpen} onOpenChange={setRegimeModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Configurar Regime Tributário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Selecione seu enquadramento fiscal atual para que o Noxus calibre os alertas do teto e a calculadora de impostos:
            </p>

            <div
              onClick={() => handleSaveRegime("MEI")}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${userRegime === "MEI" ? "border-primary bg-primary/5 font-semibold" : "hover:bg-accent/40"}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">MEI (Microempreendedor Individual)</span>
                {userRegime === "MEI" && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Limite de R$ 81.000,00/ano. Taxa fixa DAS MEI (~R$ 78/mês).</p>
            </div>

            <div
              onClick={() => handleSaveRegime("CPF")}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${userRegime === "CPF" ? "border-primary bg-primary/5 font-semibold" : "hover:bg-accent/40"}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Pessoa Física / Autônomo (CPF)</span>
                {userRegime === "CPF" && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Tabela progressiva IRPF (Carnê-Leão com Livro Caixa).</p>
            </div>

            <div
              onClick={() => handleSaveRegime("SIMPLES")}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${userRegime === "SIMPLES" ? "border-primary bg-primary/5 font-semibold" : "hover:bg-accent/40"}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Simples Nacional (ME / Microempresa)</span>
                {userRegime === "SIMPLES" && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Para quem fatura acima de R$ 81 mil/ano. Alíquota a partir de 6%.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modais Fiscais Auxiliares */}
      <TaxReportModal
        open={taxReportOpen}
        onOpenChange={setTaxReportOpen}
        transactions={transactions}
        selectedYear={selectedYear}
        userRegime={userRegime}
      />

      <ReceiptGeneratorModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        transaction={receiptTransaction}
      />
    </div>
  );
};

export default Financial;
