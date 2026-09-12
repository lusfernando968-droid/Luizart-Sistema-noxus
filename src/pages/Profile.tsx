import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Shield } from "lucide-react";

const Profile = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [joinedDate, setJoinedDate] = useState("");
    const [whatsapp, setWhatsapp] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setFetching(true);
            const token = localStorage.getItem("noxus_token");
            if (!token) return;

            const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const { user } = await res.json();
                setEmail(user.email || "");
                setFullName(user.name || "");
                setWhatsapp(user.whatsapp || "");
                const createdAt = new Date(user.createdAt);
                setJoinedDate(createdAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("noxus_token");
            
            const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/me", {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: fullName, email, whatsapp })
            });

            if (!res.ok) throw new Error("Erro ao atualizar perfil");

            toast({
                title: "Sucesso",
                description: "Perfil atualizado com sucesso.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary animate-spin rounded-full" />
            </div>
        );
    }

    return (
        <>
            <div className="page-header relative">
                <div>
                    <h1 className="page-title">Perfil</h1>
                    <p className="page-subtitle">Gerencie suas informações pessoais</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                    <CardHeader className="text-center">
                        <div className="mx-auto relative w-24 h-24 mb-4">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {fullName?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle>{fullName || "Usuário"}</CardTitle>
                        <CardDescription>Membro desde {joinedDate}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                            <Shield className="h-5 w-5 text-primary" />
                            <div className="text-left">
                                <p className="text-sm font-medium">Conta Ativa</p>
                                <p className="text-xs text-muted-foreground">Acesso ao sistema liberado</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border">
                    <CardHeader>
                        <CardTitle>Dados do Perfil</CardTitle>
                        <CardDescription>Atualize suas informações de contato</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="perf-name">Nome Completo</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="perf-email">E-mail</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="perf-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="perf-whatsapp">WhatsApp</Label>
                                <Input
                                    id="perf-whatsapp"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="rounded-xl px-8 shadow-lg shadow-primary/20"
                            >
                                {loading ? "Salvando..." : "Atualizar Perfil"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Profile;
