import sys

with open('src/components/crm/JourneyPlaybookModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add partners state and fetch logic
target_states = """  const [projectType, setProjectType] = useState<"unica" | "multipla" | "">("");
  const [activeJourney, setActiveJourney] = useState<any>(null);"""

replacement_states = """  const [projectType, setProjectType] = useState<"unica" | "multipla" | "">("");
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);"""

# 2. Add fetching to useEffect
target_effect = """        const { data: journeys } = await query;
          
        if (journeys && journeys.length > 0) {
          setActiveJourney(journeys[0]);
          if (journeys[0].playbook_data?.projectType) {
            setProjectType(journeys[0].playbook_data.projectType);
          }
        }
        
        setLoadingAppts(false);
      };
      fetchData();
    }
  }, [open, client?.id, journeyId]);"""

replacement_effect = """        const { data: journeys } = await query;
          
        if (journeys && journeys.length > 0) {
          setActiveJourney(journeys[0]);
          if (journeys[0].playbook_data?.projectType) {
            setProjectType(journeys[0].playbook_data.projectType);
          }
        }
        
        const { data: partnersData } = await supabase.from('partners').select('*').order('name');
        if (partnersData) setPartners(partnersData);

        setLoadingAppts(false);
      };
      fetchData();
    }
  }, [open, client?.id, journeyId]);"""

# 3. Update the Dropdown in render
target_dropdown = """                      <SelectContent>
                        {/* TODO: No futuro, puxar essa lista do banco de dados (Tabela Parceiros) */}
                        <SelectItem value="Carlos Eduardo (Realismo)">Carlos Eduardo (Realismo)</SelectItem>
                        <SelectItem value="Ana Beatriz (Fineline)">Ana Beatriz (Fineline)</SelectItem>
                        <SelectItem value="Rafael Souza (Old School)">Rafael Souza (Old School)</SelectItem>
                        <SelectItem value="Juliana Costa (Aquarela)">Juliana Costa (Aquarela)</SelectItem>
                        <SelectItem value="Outro Parceiro/Aluno (Digitar)">Outro Parceiro/Aluno (Digitar...)</SelectItem>
                      </SelectContent>"""

replacement_dropdown = """                      <SelectContent>
                        {partners.map(p => (
                          <SelectItem key={p.id} value={`${p.name} (${p.style})`}>
                            {p.name} ({p.style})
                          </SelectItem>
                        ))}
                        <SelectItem value="Outro Parceiro/Aluno (Digitar)">Outro Parceiro/Aluno (Digitar...)</SelectItem>
                      </SelectContent>"""

if target_states in content and target_effect in content and target_dropdown in content:
    content = content.replace(target_states, replacement_states)
    content = content.replace(target_effect, replacement_effect)
    content = content.replace(target_dropdown, replacement_dropdown)
    with open('src/components/crm/JourneyPlaybookModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Success updating JourneyPlaybookModal')
else:
    print('Target not found in JourneyPlaybookModal')
