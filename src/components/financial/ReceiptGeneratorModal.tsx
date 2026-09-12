import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Share2, FileCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  value: number;
  date: string;
  type: "entrada" | "saida";
  status: string;
}

interface ReceiptGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  providerInfo?: {
    name: string;
    document: string; // CPF or CNPJ
    address: string;
  };
}

export function ReceiptGeneratorModal({
  open,
  onOpenChange,
  transaction,
  providerInfo = {
    name: "Noxus Tattoo Studio",
    document: "00.000.000/0001-00",
    address: "Ateliê Profissional de Arte",
  },
}: ReceiptGeneratorModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [serviceDescription, setServiceDescription] = useState(transaction?.description || "Sessão de Tatuagem / Procedimento Artístico");
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const formattedValue = transaction.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const today = transaction.date || new Date().toLocaleDateString("pt-BR");

  const receiptText = `*RECIBO DE PRESTAÇÃO DE SERVIÇOS*
----------------------------------------
*Prestador:* ${providerInfo.name}
*CPF/CNPJ:* ${providerInfo.document}

*Recebi de:* ${clientName || "Cliente"}
*CPF/MF:* ${clientDocument || "Não informado"}
*A quantia de:* R$ ${formattedValue}
*Referente a:* ${serviceDescription}
*Data:* ${today}
----------------------------------------
Obrigado por escolher a nossa arte!`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    toast.success("Texto do recibo copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${providerInfo.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; }
            .receipt-box { border: 2px solid #222; border-radius: 12px; padding: 30px; max-width: 650px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 4px 0 0 0; color: #666; font-size: 13px; }
            .value-tag { text-align: right; font-size: 22px; font-weight: bold; margin-bottom: 20px; background: #f4f4f5; padding: 10px 15px; border-radius: 6px; }
            .content p { font-size: 15px; line-height: 1.8; margin: 12px 0; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-line { width: 45%; border-top: 1px solid #444; text-align: center; pt-10px; font-size: 12px; font-weight: bold; padding-top: 8px; }
            .footer { text-align: center; font-size: 11px; color: #888; margin-top: 30px; border-top: 1px border-dashed #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h1>RECIBO DE PRESTAÇÃO DE SERVIÇOS</h1>
              <p>${providerInfo.name} | CNPJ/CPF: ${providerInfo.document}</p>
              <p>${providerInfo.address}</p>
            </div>
            
            <div class="value-tag">VALOR: R$ ${formattedValue}</div>

            <div class="content">
              <p>Recebemos de <strong>${clientName || "_________________________________________"}</strong>, portador(a) do CPF <strong>${clientDocument || "___________________"}</strong>, a quantia de <strong>R$ ${formattedValue}</strong> referente a <strong>${serviceDescription}</strong>.</p>
              <p>Por ser verdade, firmamos o presente recibo dando plena e geral quitação do valor recebido.</p>
              <p>Data: <strong>${today}</strong></p>
            </div>

            <div class="signatures">
              <div class="sig-line">
                ${providerInfo.name}<br/>
                <span style="font-weight: normal; font-size: 11px;">EMISSOR / PRESTADOR</span>
              </div>
              <div class="sig-line">
                ${clientName || "CLIENTE / TOMADOR"}<br/>
                <span style="font-weight: normal; font-size: 11px;">ASSINATURA DO CLIENTE</span>
              </div>
            </div>

            <div class="footer">
              Gerado via Noxus Gestão - Sistema Profissional para Tatuadores
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Emitir Recibo de Prestação de Serviços
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1">
            <p className="font-semibold text-foreground">Dados da Transação:</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Valor: <strong className="text-foreground">R$ {formattedValue}</strong></span>
              <span>Data: <strong className="text-foreground">{today}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do Cliente</Label>
              <Input
                placeholder="Ex: João da Silva"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">CPF / CNPJ do Cliente</Label>
              <Input
                placeholder="000.000.000-00"
                value={clientDocument}
                onChange={(e) => setClientDocument(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Descrição do Serviço</Label>
            <Textarea
              rows={2}
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          {/* Pré-visualização simplificada */}
          <div className="bg-accent/20 border p-3 rounded-lg text-xs space-y-1 font-mono text-muted-foreground">
            <p className="font-bold text-foreground">Pré-visualização para WhatsApp:</p>
            <p className="whitespace-pre-line text-[11px] leading-snug">{receiptText}</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopyWhatsApp} className="gap-1.5 text-xs">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copiar p/ WhatsApp
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
