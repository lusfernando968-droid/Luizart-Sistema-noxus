import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Building2 } from "lucide-react";

export default function AnamnesisForm() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [clientData, setClientData] = useState<any>(null);
    const [studioPhone, setStudioPhone] = useState("5511999999999");

    const [formData, setFormData] = useState({
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
    }, []);

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;

            try {
                // Check if client exists
                const { data: clientData, error: clientError } = await supabase.from('clientes').select('*').eq('id', clientId).single();
                
                if (clientError || !clientData) {
                    setErrorMsg("Cliente não encontrado ou link inválido.");
                    return;
                }

                // Check if anamnesis exists
                const { data: anamnesisData } = await supabase.from('anamnesis').select('*').eq('client_id', clientId).single();

                if (anamnesisData) {
                    setSuccess(true);
                    setLoading(false);
                    return;
                }

                setClientData(clientData);
            } catch (err) {
                console.error("Error fetching client:", err);
                setErrorMsg("Erro ao carregar os dados.");
            } finally {
                setLoading(false);
            }
        };

        fetchClient();
    }, [clientId]);

    const handleCheckboxChange = (field: keyof typeof formData) => {
        setFormData(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.agreed_to_terms) {
            alert("Você precisa ler e concordar com os termos de serviço para continuar.");
            return;
        }

        if (!formData.birth_date || !formData.discovery_source) {
            alert("Por favor, preencha sua data de nascimento e nos conte como conheceu nosso trabalho.");
            return;
        }

        try {
            setSubmitting(true);

            const { error: insertError } = await supabase.from('anamnesis').insert([{
                client_id: clientId,
                discovery_source: formData.discovery_source,
                answers: formData
            }]);

            if (insertError) {
                console.error("Insert Error:", insertError);
                alert("Erro ao salvar sua ficha. Tente novamente.");
                return;
            }

            setSuccess(true);
        } catch (err) {
            console.error("Submit error:", err);
            alert("Erro inesperado ao enviar.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
                <div className="bg-card border p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
                    <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                    <h2 className="text-xl font-bold">{errorMsg}</h2>
                    <p className="text-sm text-muted-foreground">Solicite um novo link de anamnese para o seu tatuador.</p>
                </div>
            </div>
        );
    }

    if (success) {
        const whatsappMsg = encodeURIComponent(`Olá! Acabei de responder e assinar a ficha de anamnese no site.`);
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
                <div className="bg-card border p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Formulário Concluído!</h2>
                    <p className="text-muted-foreground mb-6">
                        Sua ficha de anamnese e contrato foram preenchidos com sucesso e já estão salvos com validade jurídica no nosso sistema!
                    </p>
                    
                    <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl mb-6 text-sm text-left">
                        <p className="font-semibold mb-1 flex items-center gap-1.5 text-foreground">
                            <ShieldCheck className="w-4 h-4 text-green-500" /> Segurança Jurídica:
                        </p>
                        <p className="text-muted-foreground text-xs">Sua assinatura digital, data, hora e IP do dispositivo foram autenticados no termo.</p>
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
    }

    return (
        <div className="flex-1 w-full min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Ficha de Anamnese & Contrato de Serviço</h1>
                    <p className="text-muted-foreground">Preencha com atenção para a sua própria segurança durante o procedimento.</p>
                </div>

                <div className="bg-card border shadow-xl rounded-2xl overflow-hidden text-left">
                    {/* Identificação das Partes no Cabeçalho */}
                    <div className="p-6 bg-accent/20 border-b grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-primary" /> Prestador do Serviço
                            </p>
                            <p className="font-bold text-sm text-foreground">Noxus Tattoo Studio / Profissional</p>
                            <p className="text-muted-foreground">Ateliê Profissional de Arte & Estética</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Tomador / Cliente</p>
                            <p className="font-bold text-sm text-foreground">{clientData?.name}</p>
                            <p className="text-muted-foreground">{clientData?.phone || "CPF Registrado no Sistema"}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">

                        {/* Secção Geral */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2">1. Informações Pessoais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="font-bold">Data de Nascimento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                        className="bg-accent/10"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discovery_source" className="font-bold">Como conheceu meu trabalho?</Label>
                                    <Input
                                        id="discovery_source"
                                        placeholder="Ex: Instagram, indicação de amigo..."
                                        value={formData.discovery_source}
                                        onChange={(e) => setFormData({ ...formData, discovery_source: e.target.value })}
                                        className="bg-accent/10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secção Clínica */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2">2. Histórico Clínico</h3>
                            <p className="text-sm text-muted-foreground mb-4">Marque apenas o que se aplicar a você:</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: "diabetes", label: "Diabetes" },
                                    { id: "hepatitis", label: "Hepatite" },
                                    { id: "pregnancy", label: "Gestante ou Lactante" },
                                    { id: "bleeding_disorders", label: "Problemas de Coagulação" },
                                    { id: "keloids", label: "Tendência a Queloide" }
                                ].map((item) => (
                                    <label key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-accent/30 hover:bg-accent/10 cursor-pointer transition-colors">
                                        <Checkbox
                                            id={item.id}
                                            checked={formData[item.id as keyof typeof formData] as boolean}
                                            onCheckedChange={() => handleCheckboxChange(item.id as keyof typeof formData)}
                                            className="mt-0.5"
                                        />
                                        <span className="text-sm font-medium leading-none">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="allergies" className="font-bold">Alergias (Medicamentos, cosméticos, pigmentos, etc)</Label>
                                    <Textarea
                                        id="allergies"
                                        placeholder="Se não tiver, deixe em branco"
                                        value={formData.allergies}
                                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                        className="bg-accent/10 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="medications" className="font-bold">Uso contínuo de medicamentos?</Label>
                                    <Textarea
                                        id="medications"
                                        placeholder="Quais? (Se não usar, deixe em branco)"
                                        value={formData.medications}
                                        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                                        className="bg-accent/10 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact" className="font-bold">Contato de Emergência (Nome e Telefone)</Label>
                                    <Input
                                        id="emergency_contact"
                                        placeholder="Ex: Maria (11) 99999-9999"
                                        value={formData.emergency_contact}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                                        className="bg-accent/10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secção Contrato */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2">3. Termos de Serviço e Contrato</h3>

                            <div className="bg-accent/10 p-4 rounded-lg text-sm text-muted-foreground h-48 overflow-y-auto space-y-4 border border-accent/20">
                                <p>
                                    <strong>1. DECLARAÇÃO DE SAÚDE:</strong> Declaro sob minha responsabilidade que as informações de saúde acima são verdadeiras. Isento o profissional de qualquer responsabilidade caso tenha omitido informações vitais sobre minha saúde.
                                </p>
                                <p>
                                    <strong>2. PROCEDIMENTO:</strong> Estou ciente de que a tatuagem é um procedimento definitivo e irreversível. Autorizo o profissional a realizar a arte escolhida e previamente aprovada por mim em estêncil/desenho.
                                </p>
                                <p>
                                    <strong>3. CUIDADOS PÓS-TATUAGEM:</strong> Comprometo-me a seguir rigorosamente os cuidados de cicatrização instruídos pelo tatuador (limpeza, pomada, não arrancar cascas, evitar sol, praia, piscina e alimentos remosos). O não cumprimento isenta o tatuador de garantir o retoque gratuito em caso de falha de cicatrização causada por maus cuidados.
                                </p>
                                <p>
                                    <strong>4. DIREITOS DE IMAGEM:</strong> Autorizo, de forma gratuita, o uso de fotografias ou vídeos da tatuagem realizada para fins de portfólio e divulgação nas redes sociais do tatuador.
                                </p>
                            </div>

                            <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 cursor-pointer">
                                <Checkbox
                                    id="agreed_to_terms"
                                    checked={formData.agreed_to_terms}
                                    onCheckedChange={() => handleCheckboxChange('agreed_to_terms')}
                                    className="mt-1 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                                <div className="space-y-1 leading-none">
                                    <span className="text-base font-bold text-foreground">Li e concordo com os termos de serviço e contrato</span>
                                    <p className="text-xs text-muted-foreground">Esta caixa vale como uma assinatura digital, validando meu consentimento com as regras e cuidados apresentados acima.</p>
                                    {formData.client_ip && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">IP Registrado para validade jurídica: {formData.client_ip}</p>
                                    )}
                                </div>
                            </label>

                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold shadow-xl"
                            disabled={submitting || !formData.agreed_to_terms}
                        >
                            {submitting ? "Enviando..." : "Confirmar e Enviar Ficha"}
                        </Button>

                    </form>
                </div>
            </div>
        </div>
    );
}
