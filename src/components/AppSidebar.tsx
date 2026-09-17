import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  UserCheck,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Megaphone,
  GraduationCap,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AppSidebar() {
  const { open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const collapsed = !open;
  const setCollapsed = (value: boolean) => setOpen(!value);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);

  useEffect(() => {
    const fetchUser = () => {
      try {
        const token = localStorage.getItem("noxus_token");
        const userStr = localStorage.getItem("noxus_user");
        
        if (!token || !userStr) return;

        const userData = JSON.parse(userStr);
        setUser({ email: userData.email, name: userData.name, role: userData.role });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "Agenda", path: "/agenda", icon: Calendar },
    { title: "Clientes", path: "/clientes", icon: Users },
    { title: "Financeiro", path: "/financeiro", icon: DollarSign },
    { title: "Cursos", path: "/cursos", icon: GraduationCap },
    { title: "Mentorias", path: "/mentorias", icon: Target },
  ];

  // Adiciona a aba Equipe (Sempre visível por enquanto ou se for admin)
  const isDemoMode = localStorage.getItem("noxus_demo_mode") === "true";
  if (user?.role === 'ADMIN' || isDemoMode || true) { // Removed restriction for now so user can see it
    navItems.push({ title: "Equipe", path: "/equipe", icon: UserCheck });
  }

  const handleLogout = () => {
    localStorage.removeItem("noxus_token");
    localStorage.removeItem("noxus_user");
    toast.success("Sessão encerrada");
    navigate("/auth", { replace: true });
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden lg:flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo Noxus Luizart */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center select-none cursor-default h-full py-2 overflow-hidden">
            <img
              src="/logo-app-noxus.png"
              alt="Noxus Luizart"
              className={cn(
                "h-8 object-left transition-all duration-300",
                collapsed ? "w-8 object-cover" : "w-auto object-contain"
              )}
            />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 group"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpenMobile(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-primary-foreground shadow-md shadow-sidebar-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Perfil & Logout */}
        <div className="border-t border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-xl transition-all duration-300 outline-none group text-left",
                location.pathname === "/perfil" ? "bg-primary/20" : "hover:bg-sidebar-accent"
              )}>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  location.pathname === "/perfil" ? "bg-primary text-primary-foreground" : "bg-sidebar-primary/20 text-sidebar-foreground group-hover:bg-sidebar-primary group-hover:text-primary-foreground"
                )}>
                  {user?.name?.charAt(0) || "L"}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.name || "Luizart Admin"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">
                      {user?.email || "admin@noxusluizart.com"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-4 rounded-xl border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl" align="start">
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Luizart Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="opacity-50" />
              <DropdownMenuItem
                onSelect={() => navigate("/perfil")}
                className="p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleLogout}
                className="p-3 cursor-pointer focus:bg-destructive/10 focus:text-destructive rounded-lg mx-1 text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
