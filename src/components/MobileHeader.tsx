import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, LogOut, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MobileHeader() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Load user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("noxus_token");
        if (!token) return;

        const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const { user } = await res.json();
          setUser({ email: user.email, name: user.name });
          setRole(user.role);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    fetchUser();
  }, []);

  const openSheet = () => {
    setIsOpen(true);
    setView("menu");
  };

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/auth", { replace: true });
    toast.success("Sessão encerrada");
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* Header fixo no topo — apenas mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        {/* Logo / título */}
        <div className="flex items-center gap-2">
          <img
            src="/logo-app-noxus.png"
            alt="Noxus"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Botão perfil + badge de suporte */}
        <button
          onClick={() => openSheet("menu")}
          className="relative flex items-center justify-center h-9 w-9 rounded-full bg-sidebar-primary/20 text-sidebar-foreground hover:bg-sidebar-primary/40 transition-colors font-semibold text-sm"
        >
          {initials}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sheet deslizante de cima */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-[85vw] max-w-sm bg-card flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header do sheet */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          <button
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo — Menu */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => { setIsOpen(false); navigate("/perfil"); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Meu Perfil</p>
                  <p className="text-xs text-muted-foreground">Edite seus dados</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>


            {(role === 'MASTER' || role === 'SUPERADMIN') && (
              <>
                <button
                  onClick={() => { setIsOpen(false); navigate("/admin-noxus"); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Gestão de Clientes</p>
                      <p className="text-xs text-muted-foreground">Admin Noxus</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); navigate("/admin-dashboard"); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Dashboard Admin</p>
                      <p className="text-xs text-muted-foreground">Métricas Geriais</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}

            <div className="pt-2 border-t border-border/40 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-destructive/5 transition-colors text-left text-destructive"
              >
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sair</p>
                  <p className="text-xs opacity-70">Encerrar sessão</p>
                </div>
              </button>
            </div>
          </nav>
      </div>
    </>
  );
}
