import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, LogOut, X, ChevronRight, Menu, LayoutDashboard, Calendar, Users, DollarSign, GraduationCap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Load user info
  useEffect(() => {
    // Tenta pegar do localStorage primeiro
    const userStr = localStorage.getItem("noxus_user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser({ email: parsed.email, name: parsed.name });
        setRole(parsed.role);
      } catch (e) {}
    }

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

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/auth", { replace: true });
    toast.success("Sessão encerrada");
  };
  
  const isDemoMode = localStorage.getItem("noxus_demo_mode") === "true";
  const demoRole = localStorage.getItem("noxus_demo_role");
  const isAssistant = role === 'ASSISTANT' || user?.name?.includes('Gabriel') || (isDemoMode && demoRole === 'ASSISTANT');

  const navItems = isAssistant ? [
    { title: "Agenda", path: "/agenda", icon: Calendar },
    { title: "Clientes", path: "/clientes", icon: Users },
    { title: "Financeiro", path: "/financeiro", icon: DollarSign },
  ] : [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "Agenda", path: "/agenda", icon: Calendar },
    { title: "Clientes", path: "/clientes", icon: Users },
    { title: "Financeiro", path: "/financeiro", icon: DollarSign },
    { title: "Cursos", path: "/cursos", icon: GraduationCap },
    { title: "Mentorias", path: "/mentorias", icon: Target },
    { title: "Meu Perfil", path: "/perfil", icon: User },
  ];

  return (
    <>
      {/* Header fixo no topo — apenas mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        {/* Hambúrguer + Logo */}
        <div className="flex items-center gap-3">
          {!isAssistant && (
            <button onClick={() => setIsNavOpen(true)} className="p-1 -ml-1 text-sidebar-foreground hover:bg-sidebar-primary/20 rounded-md">
              <Menu className="h-6 w-6" />
            </button>
          )}
          <img
            src="/logo-app-noxus.png"
            alt="Noxus"
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Botão Sair */}
        <button
          onClick={handleLogout}
          className="relative flex items-center justify-center h-9 w-9 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Overlays */}
      {isNavOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Nav Sheet (Esquerda) */}
      <div
        className={cn(
          "fixed top-0 left-0 z-[70] h-full w-[70vw] max-w-[280px] bg-sidebar flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-sidebar-border">
          <img src="/logo-app-noxus.png" alt="Noxus" className="h-7 w-auto object-contain" />
          <button onClick={() => setIsNavOpen(false)} className="h-8 w-8 rounded-md flex items-center justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { setIsNavOpen(false); navigate(item.path); }}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-primary-foreground shadow-md shadow-sidebar-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
