import re

with open('src/pages/Clients.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Interface
interface_pattern = r'(\s*lastVisit\?: string;\n\s*\})'
if 'totalInvoiced?: number;' not in content:
    content = re.sub(interface_pattern, r'  totalInvoiced?: number;\n\1', content)

# Update fetchClients select
select_pattern = r"select\('\*, appointments\(id, date\), referrer:clientes!referred_by_id\(name\)'\)"
content = re.sub(select_pattern, r"select('*, appointments(id, date, value), referrer:clientes!referred_by_id(name)')", content)

# Update formatted map
map_pattern = r'(sessions: c\.appointments \? c\.appointments\.length : 0,)'
if 'totalInvoiced:' not in content:
    content = re.sub(map_pattern, r'\1\n        totalInvoiced: c.appointments ? c.appointments.reduce((sum: number, app: any) => sum + (Number(app.value) || 0), 0) : 0,', content)

# Update TableHeader
table_header_pattern = r'(<TableHead>Estágio CRM</TableHead>)'
if '<TableHead className="text-right">Faturamento</TableHead>' not in content:
    content = re.sub(table_header_pattern, r'\1\n                    <TableHead className="text-right">Faturamento</TableHead>', content)

# Update TableBody
table_body_pattern = r'(<TableCell>\s*<span.*?\{client\.status\}\s*</span>\s*</TableCell>)'
if 'client.totalInvoiced' not in content:
    content = re.sub(table_body_pattern, r'\1\n                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {(client.totalInvoiced || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>', content)

# Update Profile Popup (DialogContent)
profile_pattern = r'(<div className="bg-accent/20 p-3 rounded-xl border text-center">\s*<span className="text-xs text-muted-foreground font-semibold block uppercase">Estágio CRM</span>\s*<span className="text-sm font-bold text-primary">\{selectedClient\.status\}</span>\s*</div>)'
if 'Faturamento' not in content[content.find('Estágio CRM'):]: 
    # we need to be careful with the second search. Let's just insert it after the Estágio CRM block in the popup
    content = re.sub(profile_pattern, r'\1\n                      <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">\n                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block uppercase">Faturamento</span>\n                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">R$ {(selectedClient.totalInvoiced || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>\n                      </div>', content)

with open('src/pages/Clients.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
