import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [accessCode, setAccessCode] = useState("NOXUS-ADMIN");

    useEffect(() => {
        const checkExistingSession = () => {
            const token = localStorage.getItem("noxus_token");
            if (token) {
                navigate("/dashboard", { replace: true });
            }
        };
        checkExistingSession();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!accessCode.trim()) {
            toast({
                variant: "destructive",
                title: "Código necessário",
                description: "Por favor, digite seu código de acesso.",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessCode: accessCode.trim().toUpperCase() })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || "Erro ao fazer login");
            }

            localStorage.setItem("noxus_token", data.token);
            localStorage.setItem("noxus_user", JSON.stringify(data.user));

            toast({
                title: "Bem-vindo de volta!",
                description: `Acesso liberado para ${data.user.name || data.user.accessCode}`,
            });
            
            navigate("/dashboard");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no acesso",
                description: error.message || "Verifique seu código de acesso.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-surface flex items-center justify-center p-4 relative overflow-hidden">
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md z-10 animate-fade-in shadow-2xl">
                <div className="flex flex-col items-center mb-8 select-none cursor-default">
                    <div className="flex h-16 w-auto items-center justify-center mb-4 overflow-hidden p-3 bg-[#0a192f] rounded-2xl border border-blue-900/50 shadow-xl shadow-blue-900/10">
                        <img src="/logo-app-noxus.png" alt="Noxus Luizart" className="h-full w-auto object-contain" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Noxus Luizart</h2>
                    <p className="text-muted-foreground text-xs mt-1">Gestão Interna de Estúdio</p>
                </div>

                <div className="w-full">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold">Acesso ao Estúdio</CardTitle>
                            <CardDescription>Digite seu Código de Acesso para entrar no sistema</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="accessCode" className="text-sm font-medium">Código de Acesso</Label>
                                    <div className="relative group">
                                        <Key className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            id="accessCode"
                                            type="text"
                                            placeholder="Ex: NOXUS-ADMIN, LUIZART-01"
                                            value={accessCode}
                                            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                            className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl py-6 uppercase font-mono text-base tracking-wider"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Digite o código individual fornecido pelo proprietário do estúdio.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col pt-2 gap-3">
                                <Button className="w-full h-12 rounded-xl text-md font-semibold shadow-lg shadow-primary/20 relative overflow-hidden group" disabled={loading}>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                                            Verificando Acesso...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Entrar no Estúdio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Auth;
