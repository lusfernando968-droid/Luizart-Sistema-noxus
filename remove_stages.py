import sys

content = open('src/pages/Clients.tsx', 'r', encoding='utf-8').read()
old_stages = '''const JOURNEY_STAGES = [
  { id: "Orçamento", title: "Orçamento", icon: <MessageSquare className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Primeiro contato, troca de ideias e orçamentos." },
  { id: "Garimpo", title: "Garimpo (Adiou/Caro)", icon: <Target className="w-4 h-4 text-amber-500" />, badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20", headerBg: "bg-amber-500/5", description: "Leads que adiaram ou acharam caro. Prontos para reengajamento." },
  { id: "Sem Resposta", title: "Sem Resposta (Ghost)", icon: <Ghost className="w-4 h-4 text-slate-500" />, badgeBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20", headerBg: "bg-slate-500/5", description: "Leads que sumiram após o orçamento inicial." },
  { id: "Onboarding", title: "Onboarding", icon: <ClipboardList className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Ficha de anamnese e orientações." },'''

new_stages = '''const JOURNEY_STAGES = [
  { id: "Orçamento", title: "Orçamento", icon: <MessageSquare className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Primeiro contato, troca de ideias e orçamentos." },
  { id: "Onboarding", title: "Onboarding", icon: <ClipboardList className="w-4 h-4 text-blue-500/80" />, badgeBg: "bg-muted text-foreground", headerBg: "bg-card", description: "Ficha de anamnese e orientações." },'''

if old_stages in content:
    with open('src/pages/Clients.tsx', 'w', encoding='utf-8') as f:
        f.write(content.replace(old_stages, new_stages))
    print('SUCCESS')
else:
    print('NOT FOUND')
