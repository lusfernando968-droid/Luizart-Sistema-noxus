import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Clients from "./pages/Clients";
import Financial from "./pages/Financial";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Team from "./pages/Team";
import AnamnesisForm from "./pages/AnamnesisForm";
import NotFound from "./pages/NotFound";
import Courses from "./pages/Courses";
import Mentorship from "./pages/Mentorship";
import { Layout } from "@/components/Layout";

// Authenticated layout wrapper
const AuthLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/anamnese/:clientId" element={<AnamnesisForm />} />

            {/* Rotas Autenticadas do Estúdio Noxus Luizart */}
            <Route element={<AuthLayout />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/financeiro" element={<Financial />} />
              <Route path="/equipe" element={<Team />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/cursos" element={<Courses />} />
              <Route path="/mentorias" element={<Mentorship />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
