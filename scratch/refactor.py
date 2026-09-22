import re

with open('src/pages/Clients.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { Table' not in content:
    content = content.replace(
        'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";',
        'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";'
    )

pattern = r'(<TabsContent value="lista" className="m-0 space-y-6">).*?(<TabsContent value="jornada" className="m-0">)'

def replacer(match):
    prefix = match.group(1)
    suffix = match.group(2)
    # the whole middle content of the match.group(0)
    old_content = match.group(0)
    
    # We want to extract the profile part. It starts with '<div className="bg-card rounded-xl border shadow-sm p-6 text-foreground space-y-4">'
    # Wait, in the original code, the profile card starts exactly like that.
    profile_start = old_content.find('<div className="bg-card rounded-xl border shadow-sm p-6 text-foreground space-y-4">')
    # The list tab content ends with `</TabsContent>` just before `suffix`.
    profile_end = old_content.rfind('</TabsContent>')
    
    profile_part = old_content[profile_start:profile_end]

    return prefix + '''
          <div className="bg-card rounded-xl border shadow-sm text-foreground">
            <div className="p-4 border-b">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-accent/20 h-11"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Estágio CRM</TableHead>
                    <TableHead className="text-center">Sessões</TableHead>
                    <TableHead>Última Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Carregando clientes...</TableCell>
                    </TableRow>
                  ) : filtered.length > 0 ? (
                    filtered.map((client) => (
                      <TableRow 
                        key={client.id} 
                        onClick={() => setSelectedClient(client)}
                        className="cursor-pointer hover:bg-accent/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                              {client.avatar_url ? (
                                <img src={client.avatar_url} alt={client.name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                client.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold">{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                        <TableCell>
                           <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-accent border text-foreground">
                             {client.status}
                           </span>
                        </TableCell>
                        <TableCell className="font-medium text-center">{client.sessions}</TableCell>
                        <TableCell className="text-muted-foreground">{client.lastVisit}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 border-0 gap-0 bg-transparent shadow-none">
            <div className="bg-background rounded-xl">
              {selectedClient && (
                <div className="space-y-6 p-4 sm:p-6">
                  ''' + profile_part + '''
              )}
            </div>
          </DialogContent>
        </Dialog>

        ''' + suffix

content_new = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open('src/pages/Clients.tsx', 'w', encoding='utf-8') as f:
    f.write(content_new)
print("Success")
