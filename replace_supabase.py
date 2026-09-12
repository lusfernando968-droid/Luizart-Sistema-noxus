import sys

file_path = "src/pages/Clients.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_content = """  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('clientes').select('*, appointments(id, date), referrer:clientes!referred_by_id(name)');
      if (error) throw error;

      const formatted = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "Não informado",
        instagram: c.instagram || "@",
        birthDate: c.birth_date || "",
        sessions: c.appointments ? c.appointments.length : 0,
        lastVisit: c.appointments && c.appointments.length > 0
          ? new Date(c.appointments[c.appointments.length - 1].date).toLocaleDateString("pt-BR")
          : "Sem visitas",
        status: c.status || "Orçamento",
        notes: c.notes || "",
        avatar_url: c.avatar_url,
        referred_by_id: c.referred_by_id,
        referrer_name: c.referrer?.name
      }));

      setClients(formatted);
      if (selectedClient) {
        const updated = formatted.find((c: any) => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error("Erro ao buscar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (targetId && clients.length > 0 && !selectedClient) {
      const target = clients.find(c => c.id === targetId);
      if (target) setSelectedClient(target);
    }
  }, [targetId, clients, selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientSessions(selectedClient.id);
      fetchReferredClients(selectedClient.id);
      fetchClientAnamnesis(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClientAnamnesis = async (clientId: string) => {
    try {
      setLoadingAnamnesis(true);
      const { data, error } = await supabase.from('anamnesis').select('*').eq('client_id', clientId).single();
      
      if (data && !error) {
        const answers = data.answers || {};
        setClientAnamnesis({
          medical_history: {
            diabetes: answers.diabetes,
            hepatitis: answers.hepatitis,
            pregnancy: answers.pregnancy,
            bleeding_disorders: answers.bleeding_disorders,
            keloids: answers.keloids,
          },
          birth_date: answers.birth_date,
          discovery_source: data.discovery_source,
          allergies: answers.allergies,
          medications: answers.medications,
          emergency_contact: answers.emergency_contact,
          has_contract_signed: true,
          signed_at: data.created_at
        });
      } else {
        setClientAnamnesis(null);
      }
    } catch (error) {
      console.error('Error fetching anamnesis:', error);
    } finally {
      setLoadingAnamnesis(false);
    }
  };

  const fetchClientSessions = async (clientId: string) => {
    try {
      setLoadingSessions(true);
      const { data, error } = await supabase.from('appointments').select('*').eq('client_id', clientId);
      if (error) throw error;
      setClientSessions(data || []);
    } catch (error) {
      console.error('Error fetching client sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchReferredClients = async (clientId: string) => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase.from('clientes').select('*').eq('referred_by_id', clientId);
      if (error) throw error;
      setReferredClients(data || []);
    } catch (error) {
      console.error('Error fetching referred clients:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleCopyAnamnesisLink = async () => {
    if (!selectedClient) return;
    const url = `${window.location.origin}/anamnese/${selectedClient.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch (err) {
      toast.error("Erro ao copiar o link.");
    }
  };

  const handleCreateClient = async () => {
    try {
      if (!newClientData.name) {
        toast.error("O nome é obrigatório.");
        return;
      }
      
      const { error } = await supabase.from('clientes').insert([{
        name: newClientData.name,
        phone: newClientData.phone,
        instagram: newClientData.instagram,
        birth_date: newClientData.birthDate || null,
        status: newClientData.status || "Orçamento",
        avatar_url: newClientData.avatar_url,
        referred_by_id: newClientData.referred_by_id === "none" ? null : (newClientData.referred_by_id || null)
      }]);

      if (error) throw error;

      toast.success("Cliente cadastrado com sucesso!");
      await fetchClients();
      setIsAddingClient(false);
      setNewClientData({ name: "", phone: "", instagram: "", birthDate: "", status: "Orçamento", avatar_url: "", referred_by_id: "" });
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erro ao criar cliente.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      const { error } = await supabase.from('clientes').update({ notes: tempNotes }).eq('id', selectedClient.id);
      if (error) throw error;
      
      setSelectedClient(prev => prev ? { ...prev, notes: tempNotes } : null);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, notes: tempNotes } : c));
      setIsEditingNotes(false);
      toast.success("Anotações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar anotações.");
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;
    setEditClientData({
      id: selectedClient.id,
      name: selectedClient.name,
      phone: selectedClient.phone === "Não informado" ? "" : selectedClient.phone,
      instagram: selectedClient.instagram === "@" ? "" : selectedClient.instagram,
      birthDate: selectedClient.birthDate || "",
      status: selectedClient.status || "Orçamento",
      avatar_url: selectedClient.avatar_url || "",
      referred_by_id: selectedClient.referred_by_id || "none"
    });
    setIsEditingClient(true);
  };

  const handleUpdateClient = async () => {
    try {
      if (!editClientData.name) {
        toast.error("O nome é obrigatório.");
        return;
      }
      setUploading(true);
      
      const { error } = await supabase.from('clientes').update({
        name: editClientData.name,
        phone: editClientData.phone,
        instagram: editClientData.instagram,
        birth_date: editClientData.birthDate || null,
        status: editClientData.status,
        referred_by_id: editClientData.referred_by_id === "none" ? null : (editClientData.referred_by_id || null)
      }).eq('id', editClientData.id);

      if (error) throw error;

      toast.success("Cliente atualizado com sucesso!");
      await fetchClients();
      setIsEditingClient(false);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateClientStatus = async (clientId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('clientes').update({ status: newStatus }).eq('id', clientId);
      if (error) throw error;

      toast.success(`Cliente movido para "${newStatus}"!`);
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
      if (selectedClient?.id === clientId) {
        setSelectedClient(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar etapa do cliente.");
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${selectedClient.name}? Esta ação não pode ser desfeita.`)) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('clientes').delete().eq('id', selectedClient.id);
      if (error) throw error;

      toast.success("Cliente excluído com sucesso!");
      setSelectedClient(null);
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente.');
    } finally {
      setLoading(false);
    }
  };\n"""

# lines 93 (0-indexed 92) to 422 (0-indexed 421) should be replaced
new_lines = lines[:93] + [new_content] + lines[422:]

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
