import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, ExternalLink, ShieldAlert, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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

interface TaxReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  selectedYear: number;
  userRegime?: string;
}

export function TaxReportModal({
  open,
  onOpenChange,
  transactions,
  selectedYear,
  userRegime = "MEI",
}: TaxReportModalProps) {
  const entradas = transactions.filter((t) => t.type === "entrada");
  const saidas = transactions.filter((t) => t.type === "saida");
  const saidasDedutiveis = saidas.filter((t) => t.isDeductible);

  const totalFaturamentoBruto = entradas.reduce((acc, t) => acc + t.value, 0);
  const totalDespesasGerais = saidas.reduce((acc, t) => acc + t.value, 0);
  const totalDespesasDedutiveis = saidasDedutiveis.reduce((acc, t) => acc + t.value, 0);

  // Base de Cálculo Líquida (para Livro Caixa / Carnê-Leão no CPF)
  const baseCalculoLiquida = Math.max(0, totalFaturamentoBruto - totalDespesasDedutiveis);

  const handleExportCSV = () => {
    try {
      const headers = "Data,Tipo,Descrição,Valor (R$),Categoria Fiscal,Link do Comprovante (Drive)\n";
      const rows = transactions
        .map((t) => {
          const cat = t.type === "entrada" ? "Receita" : t.isDeductible ? "Despesa Dedutível (Livro Caixa)" : "Despesa Operacional";
          const link = t.driveLink || "Não anexado";
          return `"${t.date}","${t.type}","${t.description.replace(/"/g, '""')}","${t.value.toFixed(2)}","${cat}","${link}"`;
        })
        .join("\n");

      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Relatorio_Fiscal_Noxus_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Relatório fiscal exportado em CSV com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar arquivo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Relatório de Consolidação Fiscal & Imposto de Renda ({selectedYear})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quadros de Resumo Fiscais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-accent/40 border p-3 rounded-xl">
              <span className="text-xs text-muted-foreground uppercase font-semibold block">Faturamento Bruto</span>
              <span className="text-xl font-bold text-foreground">R$ {totalFaturamentoBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Total de receitas informadas</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 uppercase font-semibold block">Deduções Livro Caixa</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$ {totalDespesasDedutiveis.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">Despesas dedutíveis comprovadas</p>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
              <span className="text-xs text-primary uppercase font-semibold block">Base de Cálculo Líquida</span>
              <span className="text-xl font-bold text-primary">R$ {baseCalculoLiquida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Valor tributável final</p>
            </div>
          </div>

          {/* Banner de Instrução para Contador */}
          <div className="bg-muted p-3.5 rounded-xl border text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Instrução para a Declaração de Imposto de Renda / Contador:</p>
              <p className="text-muted-foreground leading-relaxed">
                Este relatório compila todas as entradas e saídas do período com os links diretos para os comprovantes hospedados no Google Drive.
                Envie o arquivo exportado em CSV/Excel diretamente ao seu contador para inclusão na DASN-SIMEI (MEI) ou Carnê-Leão/IRPF.
              </p>
            </div>
          </div>

          {/* Tabela de Transações com Links do Google Drive */}
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/40 text-xs">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Comprovante (Drive)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-accent/20">
                      <TableCell className="font-medium">{t.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span>{t.description}</span>
                          {t.isDeductible && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Dedutível
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.type === "entrada" ? "text-emerald-500 border-emerald-500/20" : "text-rose-500 border-rose-500/20"}>
                          {t.type === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${t.type === "entrada" ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === "entrada" ? "+" : "-"} R$ {t.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {t.driveLink ? (
                          <a
                            href={t.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px]"
                          >
                            <span>Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">Sem anexo</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhuma transação registrada neste período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>
          <Button onClick={handleExportCSV} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Download className="w-3.5 h-3.5" />
            Baixar Relatório CSV (Excel)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
