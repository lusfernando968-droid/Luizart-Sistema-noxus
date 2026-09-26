import re

with open('src/pages/Agenda.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the CommandItem click issue
text = text.replace(
'''                              onSelect={() => {
                                setFormData(prev => ({ ...prev, client_id: client.id, journey_id: "" }));
                                setClientDropdownOpen(false);
                              }}''',
'''                              onSelect={() => {
                                setFormData(prev => ({ ...prev, client_id: client.id, journey_id: "" }));
                                setClientDropdownOpen(false);
                              }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFormData(prev => ({ ...prev, client_id: client.id, journey_id: "" }));
                                setClientDropdownOpen(false);
                              }}'''
)

# Inject the Journey dropdown again, correctly this time.
# Let's find exactly where to put it.
search_str = '''                  </PopoverContent>
                </Popover>
              </div>'''

ui_inj = '''                  </PopoverContent>
                </Popover>
              </div>

              {formData.client_id && (
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5">
                    <List className="w-4 h-4 text-primary" /> Jornada (Projeto)
                  </Label>
                  <Select 
                    value={formData.journey_id || ""} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, journey_id: val }))}
                    disabled={loadingJourneys || clientJourneys.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingJourneys ? "Carregando..." : clientJourneys.length === 0 ? "Nenhuma jornada encontrada" : "Selecione a jornada..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientJourneys.map(j => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.status} {j.status === 'Concluído' ? '(Antiga)' : '(Atual)'} - Criada em {new Date(j.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientJourneys.length === 0 && !loadingJourneys && (
                    <p className="text-xs text-muted-foreground mt-1">Este cliente não possui jornadas no CRM.</p>
                  )}
                </div>
              )}'''

text = text.replace(search_str, ui_inj)

with open('src/pages/Agenda.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
