import sys

file_path = "src/pages/Clients.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_btn_html = """
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePrintAnamnesis()} className="h-8 text-xs">
                              Baixar PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCopyAnamnesisLink} className="h-8 text-xs w-full sm:w-auto">
                              Copiar Link
                            </Button>
                          </div>
"""

old_btn_html = """<Button variant="outline" size="sm" onClick={handleCopyAnamnesisLink} className="h-8 text-xs w-full sm:w-auto">
                            Copiar Link
                          </Button>"""

content = content.replace(old_btn_html, new_btn_html)

print_logic = """
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

content = content.replace("const handleCopyAnamnesisLink = async () => {", print_logic + "\n  const handleCopyAnamnesisLink = async () => {")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
