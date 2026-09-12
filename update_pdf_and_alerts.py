import sys

file_path = "src/pages/Clients.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add html2pdf import
if "import html2pdf from 'html2pdf.js';" not in content:
    content = content.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport html2pdf from "html2pdf.js";')

# 2. Update handlePrintAnamnesis
old_print_logic = """
  const handlePrintAnamnesis = () => {
    if (!selectedClient || !clientAnamnesis) {
      toast.error("Ficha não disponível para download.");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Ficha de Anamnese - ${selectedClient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; color: #333; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { margin-top: 30px; font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            p { margin: 10px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .terms { background: #f9f9f9; padding: 15px; font-size: 14px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px; }
            .signature { margin-top: 40px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Ficha de Anamnese e Contrato</h1>
          
          <div class="info-grid">
            <div>
              <h2>Dados do Cliente</h2>
              <p><strong>Nome:</strong> ${selectedClient.name}</p>
              <p><strong>Telefone:</strong> ${selectedClient.phone}</p>
              <p><strong>Data de Nascimento:</strong> ${clientAnamnesis.birth_date ? new Date(clientAnamnesis.birth_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong>Contato de Emergência:</strong> ${clientAnamnesis.emergency_contact || 'N/A'}</p>
            </div>
            
            <div>
              <h2>Histórico Clínico</h2>
              <p><strong>Alergias:</strong> ${clientAnamnesis.allergies || 'Nenhuma'}</p>
              <p><strong>Medicamentos Contínuos:</strong> ${clientAnamnesis.medications || 'Nenhum'}</p>
              <p><strong>Condições:</strong> 
                ${clientAnamnesis.medical_history?.diabetes ? 'Diabetes, ' : ''}
                ${clientAnamnesis.medical_history?.hepatitis ? 'Hepatite, ' : ''}
                ${clientAnamnesis.medical_history?.pregnancy ? 'Gestante/Lactante, ' : ''}
                ${clientAnamnesis.medical_history?.bleeding_disorders ? 'Problemas de Coagulação, ' : ''}
                ${clientAnamnesis.medical_history?.keloids ? 'Tendência a Queloide, ' : ''}
              </p>
            </div>
          </div>

          <h2>Termos de Serviço e Contrato</h2>
          <div class="terms">
            <p>1. <strong>DECLARAÇÃO DE SAÚDE:</strong> Declaro sob minha responsabilidade que as informações de saúde acima são verdadeiras. Isento o profissional de qualquer responsabilidade caso tenha omitido informações vitais sobre minha saúde.</p>
            <p>2. <strong>PROCEDIMENTO:</strong> Estou ciente de que a tatuagem é um procedimento definitivo e irreversível. Autorizo o profissional a realizar a arte escolhida e previamente aprovada por mim em estêncil/desenho.</p>
            <p>3. <strong>CUIDADOS PÓS-TATUAGEM:</strong> Comprometo-me a seguir rigorosamente os cuidados de cicatrização instruídos pelo tatuador (limpeza, pomada, não arrancar cascas, evitar sol, praia, piscina e alimentos remosos). O não cumprimento isenta o tatuador de garantir o retoque gratuito em caso de falha de cicatrização causada por maus cuidados.</p>
            <p>4. <strong>DIREITOS DE IMAGEM:</strong> Autorizo, de forma gratuita, o uso de fotografias ou vídeos da tatuagem realizada para fins de portfólio e divulgação nas redes sociais do tatuador.</p>
          </div>

          <div class="signature">
            <p>Assinado Eletronicamente (Aceite Digital)</p>
            <p>Data do Aceite: ${new Date(clientAnamnesis.signed_at).toLocaleString('pt-BR')}</p>
            <p>IP Registrado no Sistema Noxus</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // setTimeout is needed for some browsers to render before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
"""

new_print_logic = """
  const handlePrintAnamnesis = () => {
    if (!selectedClient || !clientAnamnesis) {
      toast.error("Ficha não disponível para download.");
      return;
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #333; max-width: 800px; margin: 0 auto;">
          <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">Ficha de Anamnese e Contrato</h1>
          
          <div style="display: flex; justify-content: space-between; gap: 20px; margin-top: 20px;">
            <div style="flex: 1;">
              <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Dados do Cliente</h2>
              <p><strong>Nome:</strong> ${selectedClient.name}</p>
              <p><strong>Telefone:</strong> ${selectedClient.phone}</p>
              <p><strong>Data de Nascimento:</strong> ${clientAnamnesis.birth_date ? new Date(clientAnamnesis.birth_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong>Contato de Emergência:</strong> ${clientAnamnesis.emergency_contact || 'N/A'}</p>
            </div>
            
            <div style="flex: 1;">
              <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Histórico Clínico</h2>
              <p><strong>Alergias:</strong> ${clientAnamnesis.allergies || 'Nenhuma'}</p>
              <p><strong>Medicamentos Contínuos:</strong> ${clientAnamnesis.medications || 'Nenhum'}</p>
              <p><strong>Condições:</strong> 
                ${clientAnamnesis.medical_history?.diabetes ? 'Diabetes, ' : ''}
                ${clientAnamnesis.medical_history?.hepatitis ? 'Hepatite, ' : ''}
                ${clientAnamnesis.medical_history?.pregnancy ? 'Gestante/Lactante, ' : ''}
                ${clientAnamnesis.medical_history?.bleeding_disorders ? 'Problemas de Coagulação, ' : ''}
                ${clientAnamnesis.medical_history?.keloids ? 'Tendência a Queloide, ' : ''}
                ${!clientAnamnesis.medical_history?.diabetes && !clientAnamnesis.medical_history?.hepatitis && !clientAnamnesis.medical_history?.pregnancy && !clientAnamnesis.medical_history?.bleeding_disorders && !clientAnamnesis.medical_history?.keloids ? 'Nenhuma condição assinalada.' : ''}
              </p>
            </div>
          </div>

          <h2 style="margin-top: 30px; font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Termos de Serviço e Contrato</h2>
          <div style="background: #f9f9f9; padding: 15px; font-size: 14px; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px;">
            <p>1. <strong>DECLARAÇÃO DE SAÚDE:</strong> Declaro sob minha responsabilidade que as informações de saúde acima são verdadeiras. Isento o profissional de qualquer responsabilidade caso tenha omitido informações vitais sobre minha saúde.</p>
            <p>2. <strong>PROCEDIMENTO:</strong> Estou ciente de que a tatuagem é um procedimento definitivo e irreversível. Autorizo o profissional a realizar a arte escolhida e previamente aprovada por mim em estêncil/desenho.</p>
            <p>3. <strong>CUIDADOS PÓS-TATUAGEM:</strong> Comprometo-me a seguir rigorosamente os cuidados de cicatrização instruídos pelo tatuador (limpeza, pomada, não arrancar cascas, evitar sol, praia, piscina e alimentos remosos). O não cumprimento isenta o tatuador de garantir o retoque gratuito em caso de falha de cicatrização causada por maus cuidados.</p>
            <p>4. <strong>DIREITOS DE IMAGEM:</strong> Autorizo, de forma gratuita, o uso de fotografias ou vídeos da tatuagem realizada para fins de portfólio e divulgação nas redes sociais do tatuador.</p>
          </div>

          <div style="margin-top: 40px; text-align: center; font-weight: bold;">
            <p>Assinado Eletronicamente (Aceite Digital)</p>
            <p>Data do Aceite: ${new Date(clientAnamnesis.signed_at).toLocaleString('pt-BR')}</p>
            <p>IP Registrado no Sistema Noxus: ${clientAnamnesis.client_ip || 'Desconhecido'}</p>
          </div>
      </div>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = html;
    
    const opt = {
      margin:       10,
      filename:     `Anamnese_${selectedClient.name.replace(/\\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    toast.success("Download do PDF iniciado!");
  };
"""

content = content.replace(old_print_logic, new_print_logic)


# 3. Update Anamnesis display in CRM to show alerts
old_display = """                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                              {clientAnamnesis.allergies && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Alergias:</p>
                                  <p className="font-semibold">{clientAnamnesis.allergies}</p>
                                </div>
                              )}
                              {clientAnamnesis.medications && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Medicamentos:</p>
                                  <p className="font-semibold">{clientAnamnesis.medications}</p>
                                </div>
                              )}
                              {clientAnamnesis.discovery_source && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Como conheceu:</p>
                                  <p className="font-semibold">{clientAnamnesis.discovery_source}</p>
                                </div>
                              )}
                            </div>"""

new_display = """                            <div className="grid grid-cols-1 gap-3 mt-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {clientAnamnesis.allergies && (
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Alergias:</p>
                                    <p className="font-semibold">{clientAnamnesis.allergies}</p>
                                  </div>
                                )}
                                {clientAnamnesis.medications && (
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Medicamentos:</p>
                                    <p className="font-semibold">{clientAnamnesis.medications}</p>
                                  </div>
                                )}
                                {clientAnamnesis.discovery_source && (
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Como conheceu:</p>
                                    <p className="font-semibold">{clientAnamnesis.discovery_source}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Alertas Médicos Inteligentes */}
                              {(clientAnamnesis.medical_history?.hepatitis || clientAnamnesis.medical_history?.diabetes || clientAnamnesis.medical_history?.pregnancy || clientAnamnesis.medical_history?.bleeding_disorders || clientAnamnesis.medical_history?.keloids) && (
                                <div className="mt-2 space-y-2 border-t border-success/20 pt-3">
                                  <p className="text-destructive font-bold flex items-center gap-1.5 mb-2">
                                    <AlertCircle className="h-4 w-4" /> Alertas Clínicos Importantes:
                                  </p>
                                  
                                  {clientAnamnesis.medical_history?.hepatitis && (
                                    <div className="bg-destructive/10 text-destructive-foreground p-2 rounded border border-destructive/20">
                                      <span className="font-bold">HEPATITE:</span> Atenção máxima ao descarte de agulhas e higienização da bancada para evitar contaminação cruzada.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.diabetes && (
                                    <div className="bg-amber-500/10 text-amber-700 p-2 rounded border border-amber-500/20">
                                      <span className="font-bold">DIABETES:</span> Cicatrização mais lenta. Reforce cuidados pós-tattoo e verifique se a diabetes está controlada.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.pregnancy && (
                                    <div className="bg-destructive/10 text-destructive-foreground p-2 rounded border border-destructive/20">
                                      <span className="font-bold">GESTANTE/LACTANTE:</span> Não é recomendado tatuar sem autorização médica expressa.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.bleeding_disorders && (
                                    <div className="bg-destructive/10 text-destructive-foreground p-2 rounded border border-destructive/20">
                                      <span className="font-bold">COAGULAÇÃO:</span> Risco de sangramento excessivo durante a sessão. Pode afetar a pigmentação.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.keloids && (
                                    <div className="bg-amber-500/10 text-amber-700 p-2 rounded border border-amber-500/20">
                                      <span className="font-bold">QUELOIDE:</span> Risco de cicatriz hipertrófica. Avise o cliente que o traço pode expandir ou ficar em alto relevo.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>"""

content = content.replace(old_display, new_display)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
