import sys

with open('src/pages/Clients.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            <div className="p-4 border-b">
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

            <div className="overflow-x-auto">"""

replacement = """            <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-accent/20 h-11"
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground self-end sm:self-auto h-9 px-3 gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
            
            {showFilters && (
               <div className="px-4 py-3 border-b bg-accent/10 flex items-center gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-1.5 w-full max-w-xs">
                     <Label className="text-xs text-muted-foreground font-semibold">Filtrar por Estágio</Label>
                     <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full h-9 bg-card text-sm">
                           <SelectValue placeholder="Todos os Estágios" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">Todos os Estágios</SelectItem>
                           {JOURNEY_STAGES.map(stage => (
                             <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            )}

            <div className="overflow-x-auto">"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/Clients.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
