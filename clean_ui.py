import sys

file_path = "src/pages/Clients.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_display = """                        ) : clientAnamnesis ? (
                          <div className="text-xs space-y-3 bg-success/5 p-3 rounded-lg border border-success/20">
                            <p className="text-success font-semibold flex items-center gap-1.5 text-sm">
                              <CheckCircle2 className="h-4 w-4" /> Ficha Preenchida
                            </p>
                            <div className="grid grid-cols-1 gap-3 mt-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {clientAnamnesis.allergies && (
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Alergias:</p>
                                    <p className="font-semibold">{clientAnamnesis.allergies}</p>
                                  </div>
                                )}
                                {clientAnamnesis.medications && (
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Medicamentos:</p>
                                    <p className="font-semibold">{clientAnamnesis.medications}</p>
                                  </div>
                                )}
                                {clientAnamnesis.discovery_source && (
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Como conheceu:</p>
                                    <p className="font-semibold">{clientAnamnesis.discovery_source}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Alertas Médicos Inteligentes */}
                              {(clientAnamnesis.medical_history?.hepatitis || clientAnamnesis.medical_history?.diabetes || clientAnamnesis.medical_history?.pregnancy || clientAnamnesis.medical_history?.bleeding_disorders || clientAnamnesis.medical_history?.keloids) && (
                                <div className="mt-2 space-y-2 border-t border-success/20 pt-3">
                                  <p className="text-destructive font-bold flex items-center gap-1.5 mb-2">
                                    <AlertCircle className="h-4 w-4" /> Alertas Clínicos Importantes:
                                  </p>
                                  
                                  {clientAnamnesis.medical_history?.hepatitis && (
                                    <div className="bg-destructive/10 text-destructive-foreground p-2 rounded border border-destructive/20">
                                      <span className="font-bold">HEPATITE:</span> Atenção máxima ao descarte de agulhas e higienização da bancada para evitar contaminação cruzada.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.diabetes && (
                                    <div className="bg-amber-500/10 text-amber-700 p-2 rounded border border-amber-500/20">
                                      <span className="font-bold">DIABETES:</span> Cicatrização mais lenta. Reforce cuidados pós-tattoo e verifique se a diabetes está controlada.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.pregnancy && (
                                    <div className="bg-destructive/10 text-destructive-foreground p-2 rounded border border-destructive/20">
                                      <span className="font-bold">GESTANTE/LACTANTE:</span> Não é recomendado tatuar sem autorização médica expressa.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.bleeding_disorders && (
                                    <div className="bg-destructive/10 text-destructive-foreground p-2 rounded border border-destructive/20">
                                      <span className="font-bold">COAGULAÇÃO:</span> Risco de sangramento excessivo durante a sessão. Pode afetar a pigmentação.
                                    </div>
                                  )}
                                  {clientAnamnesis.medical_history?.keloids && (
                                    <div className="bg-amber-500/10 text-amber-700 p-2 rounded border border-amber-500/20">
                                      <span className="font-bold">QUELOIDE:</span> Risco de cicatriz hipertrófica. Avise o cliente que o traço pode expandir ou ficar em alto relevo.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : ("""

new_display = """                        ) : clientAnamnesis ? (
                          <div className="text-xs space-y-4 pt-2">
                            <p className="text-success font-semibold flex items-center gap-1.5 text-sm mb-2 border-b pb-2">
                              <CheckCircle2 className="h-4 w-4" /> Ficha Preenchida em {new Date(clientAnamnesis.signed_at).toLocaleDateString('pt-BR')}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {clientAnamnesis.emergency_contact && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Contato de Emergência:</p>
                                  <p className="font-semibold text-foreground">{clientAnamnesis.emergency_contact}</p>
                                </div>
                              )}
                              {clientAnamnesis.discovery_source && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Como conheceu:</p>
                                  <p className="font-semibold text-foreground">{clientAnamnesis.discovery_source}</p>
                                </div>
                              )}
                              {clientAnamnesis.allergies && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Alergias:</p>
                                  <p className="font-semibold text-foreground">{clientAnamnesis.allergies}</p>
                                </div>
                              )}
                              {clientAnamnesis.medications && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-0.5">Medicamentos:</p>
                                  <p className="font-semibold text-foreground">{clientAnamnesis.medications}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Alertas Médicos Inteligentes - Clean Design */}
                            {(clientAnamnesis.medical_history?.hepatitis || clientAnamnesis.medical_history?.diabetes || clientAnamnesis.medical_history?.pregnancy || clientAnamnesis.medical_history?.bleeding_disorders || clientAnamnesis.medical_history?.keloids) && (
                              <div className="mt-4 space-y-3 border-t pt-4">
                                <p className="text-red-500 font-bold flex items-center gap-1.5 mb-1">
                                  <AlertCircle className="h-4 w-4" /> Alertas Clínicos Importantes:
                                </p>
                                
                                {clientAnamnesis.medical_history?.hepatitis && (
                                  <div className="text-red-500 flex items-start gap-2">
                                    <span className="font-bold shrink-0">• HEPATITE:</span> 
                                    <span>Atenção máxima ao descarte de agulhas e higienização da bancada para evitar contaminação cruzada.</span>
                                  </div>
                                )}
                                {clientAnamnesis.medical_history?.diabetes && (
                                  <div className="text-amber-500 flex items-start gap-2">
                                    <span className="font-bold shrink-0">• DIABETES:</span> 
                                    <span>Cicatrização mais lenta. Reforce cuidados pós-tattoo e verifique se a diabetes está controlada.</span>
                                  </div>
                                )}
                                {clientAnamnesis.medical_history?.pregnancy && (
                                  <div className="text-red-500 flex items-start gap-2">
                                    <span className="font-bold shrink-0">• GESTANTE/LACTANTE:</span> 
                                    <span>Não é recomendado tatuar sem autorização médica expressa.</span>
                                  </div>
                                )}
                                {clientAnamnesis.medical_history?.bleeding_disorders && (
                                  <div className="text-red-500 flex items-start gap-2">
                                    <span className="font-bold shrink-0">• COAGULAÇÃO:</span> 
                                    <span>Risco de sangramento excessivo durante a sessão. Pode afetar a pigmentação.</span>
                                  </div>
                                )}
                                {clientAnamnesis.medical_history?.keloids && (
                                  <div className="text-amber-500 flex items-start gap-2">
                                    <span className="font-bold shrink-0">• QUELOIDE:</span> 
                                    <span>Risco de cicatriz hipertrófica. Avise o cliente que o traço pode expandir ou ficar em alto relevo.</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : ("""

if old_display in content:
    content = content.replace(old_display, new_display)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("UI limpa com sucesso.")
else:
    print("Código antigo não encontrado. Pode já ter sido atualizado.")
