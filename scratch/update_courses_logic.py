import re

with open('src/pages/Courses.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update tab titles
content = content.replace('Turmas Presenciais', 'Aulas Individuais')
content = content.replace('Gestão de turmas presenciais, produção e plataforma online.', 'Gestão de aulas presenciais 1 a 1, playbook e plataforma online.')

# Update presencial tab content
old_presencial = r'(<TabsContent value="presencial" className="m-0 space-y-6">).*?(</TabsContent>)'
new_presencial = r'''\1
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Aulas Presenciais (1 a 1)</h2>
                <p className="text-sm text-muted-foreground">R$ 50/hora • Foco prático • Transição para Mentoria</p>
              </div>
              <Button className="gap-2 rounded-full h-10 px-5 shadow-md">
                <Plus className="h-4 w-4" />
                Agendar Aula
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-2xl border shadow-sm p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[250px] border-dashed border-2 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Novo Aluno Presencial</h3>
                  <p className="text-sm text-muted-foreground mt-1">Agende a primeira aula prática de traço.</p>
                </div>
              </div>
            </div>
\2'''

content = re.sub(old_presencial, new_presencial, content, flags=re.DOTALL)

# Update production tab content
old_producao = r'(<TabsContent value="producao" className="m-0 space-y-6">).*?(</TabsContent>)'
new_producao = r'''\1
             <div className="bg-card rounded-2xl border shadow-sm p-8 text-left space-y-6">
               <div className="flex items-center gap-4 border-b pb-4">
                 <div className="h-16 w-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                   <CheckCircle2 className="h-8 w-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-foreground">Playbook & Metodologia</h3>
                   <p className="text-muted-foreground">Roteiro técnico direto ao ponto para alunos iniciantes.</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Etapas da Aula 1 a 1</h4>
                   <ul className="space-y-3">
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Entrega do Script:</strong> Biossegurança e Montagem de Máquina (Leitura autônoma).</span></li>
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Prática Imediata:</strong> Quebrar o medo da máquina. Foco total no traço.</span></li>
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Avaliação:</strong> Análise de profundidade e consistência do traço.</span></li>
                     <li className="flex items-start gap-3 text-sm"><div className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary"></div></div> <span><strong className="text-foreground">Transição:</strong> Pele artificial vs Pele real.</span></li>
                   </ul>
                 </div>
                 
                 <div className="space-y-4 bg-muted/30 p-5 rounded-xl border">
                   <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Funil de Crescimento</h4>
                   <p className="text-sm text-muted-foreground">As aulas presenciais são rápidas e focadas na base. Após o aluno dominar a máquina, o objetivo é transferi-lo para a <strong>Mentoria</strong> de longo prazo.</p>
                   <Button variant="outline" className="w-full mt-2 gap-2 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/10">
                     Ver Alunos Prontos p/ Mentoria <ChevronRight className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </div>
\2'''

content = re.sub(old_producao, new_producao, content, flags=re.DOTALL)


with open('src/pages/Courses.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Courses.tsx updated with 1-on-1 logic")
