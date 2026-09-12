import sys

file_path = "src/pages/AnamnesisForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Substituir o estado formData
old_state = """    const [formData, setFormData] = useState({
        birth_date: "",
        discovery_source: "",
        diabetes: false,
        hepatitis: false,
        pregnancy: false,
        bleeding_disorders: false,
        keloids: false,
        allergies: "",
        medications: "",
        emergency_contact: "",
        agreed_to_terms: false
    });"""

new_state = """    const [formData, setFormData] = useState({
        birth_date: "",
        discovery_source: "",
        diabetes: false,
        hepatitis: false,
        pregnancy: false,
        bleeding_disorders: false,
        keloids: false,
        allergies: "",
        medications: "",
        emergency_contact: "",
        agreed_to_terms: false,
        client_ip: ""
    });

    useEffect(() => {
        // Capturar o IP do cliente assim que a tela abre
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                setFormData(prev => ({ ...prev, client_ip: data.ip }));
            })
            .catch(err => console.log("Erro ao capturar IP:", err));
    }, []);"""

content = content.replace(old_state, new_state)

# Atualizar o sucesso (success screen) para ter o botão do WhatsApp
old_success = """    if (success) {
        return (
            <div className="flex-1 w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-card text-foreground p-8 rounded-2xl max-w-md w-full text-center border shadow-xl">
                    <div className="h-20 w-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Formulário Concluído!</h2>
                    <p className="text-muted-foreground mb-8">
                        Sua ficha de anamnese e contrato foram preenchidos com sucesso e já estão no sistema do estúdio.
                    </p>
                    <p className="text-sm font-semibold opacity-70">
                        Muito obrigado, e até a sua sessão!
                    </p>
                </div>
            </div>
        );
    }"""

new_success = """    if (success) {
        const whatsappMsg = encodeURIComponent(`Olá! Acabei de preencher e assinar a minha ficha de anamnese digital. Meu IP de assinatura foi registrado como: ${formData.client_ip}`);
        // Substitua pelo número do WhatsApp do estúdio
        const studioPhone = "5511999999999"; 
        
        return (
            <div className="flex-1 w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-card text-foreground p-8 rounded-2xl max-w-md w-full text-center border shadow-xl">
                    <div className="h-20 w-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Formulário Concluído!</h2>
                    <p className="text-muted-foreground mb-6">
                        Sua ficha de anamnese e contrato foram preenchidos com sucesso e já estão no nosso sistema!
                    </p>
                    
                    <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl mb-6 text-sm">
                        <p className="font-semibold mb-1">Para a sua segurança jurídica:</p>
                        <p className="text-muted-foreground text-xs">Por favor, clique no botão abaixo para nos enviar uma mensagem no WhatsApp confirmando a sua assinatura.</p>
                    </div>

                    <a 
                        href={`https://wa.me/${studioPhone}?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors mb-4"
                    >
                        Confirmar via WhatsApp
                    </a>

                    <p className="text-xs font-semibold opacity-70 mt-4">
                        Muito obrigado, e até a sua sessão!
                    </p>
                </div>
            </div>
        );
    }"""

content = content.replace(old_success, new_success)

# Modificar o contrato para mostrar o IP
old_contract = """                                <div className="space-y-1 leading-none">
                                    <span className="text-base font-bold text-foreground">Li e concordo com os termos de serviço</span>
                                    <p className="text-xs text-muted-foreground">Esta caixa vale como uma assinatura digital, validando meu consentimento com as regras e cuidados apresentados acima.</p>
                                </div>"""

new_contract = """                                <div className="space-y-1 leading-none">
                                    <span className="text-base font-bold text-foreground">Li e concordo com os termos de serviço</span>
                                    <p className="text-xs text-muted-foreground">Esta caixa vale como uma assinatura digital, validando meu consentimento com as regras e cuidados apresentados acima.</p>
                                    {formData.client_ip && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-2">IP Registrado para validade jurídica: {formData.client_ip}</p>
                                    )}
                                </div>"""

content = content.replace(old_contract, new_contract)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
