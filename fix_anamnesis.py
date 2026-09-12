import sys

file_path = "src/pages/AnamnesisForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Substituir o import e adicionar supabase
content = content.replace('import { AlertCircle', 'import { supabase } from "@/lib/supabase";\nimport { AlertCircle')

# Substituir fetchClient
old_fetch = """        const fetchClient = async () => {
            if (!clientId) return;

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/anamnesis/${clientId}`);
                const data = await res.json();
                
                if (!res.ok) {
                    setErrorMsg(data.error || "Cliente não encontrado ou link inválido.");
                    return;
                }

                if (data.hasAnamnesis) {
                    setSuccess(true);
                    setLoading(false);
                    return;
                }

                setClientData(data.client);
            } catch (err) {
                console.error("Error fetching client:", err);
                setErrorMsg("Erro ao carregar os dados.");
            } finally {
                setLoading(false);
            }
        };"""

new_fetch = """        const fetchClient = async () => {
            if (!clientId) return;

            try {
                // Check if client exists
                const { data: clientData, error: clientError } = await supabase.from('clientes').select('*').eq('id', clientId).single();
                
                if (clientError || !clientData) {
                    setErrorMsg("Cliente não encontrado ou link inválido.");
                    return;
                }

                // Check if anamnesis exists
                const { data: anamnesisData } = await supabase.from('anamnesis').select('*').eq('client_id', clientId).single();

                if (anamnesisData) {
                    setSuccess(true);
                    setLoading(false);
                    return;
                }

                setClientData(clientData);
            } catch (err) {
                console.error("Error fetching client:", err);
                setErrorMsg("Erro ao carregar os dados.");
            } finally {
                setLoading(false);
            }
        };"""

content = content.replace(old_fetch, new_fetch)

# Substituir handleSubmit
old_submit = """        try {
            setSubmitting(true);

            // Calculate age from birth date
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/anamnesis/${clientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData,
                    age
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erro ao salvar anamnese");
            }

            setSuccess(true);
        } catch (err: any) {
            console.error("Error saving anamnesis:", err);
            alert("Erro ao salvar o formulário: " + (err.message || "Tente novamente."));
        } finally {
            setSubmitting(false);
        }"""

new_submit = """        try {
            setSubmitting(true);

            const { error: insertError } = await supabase.from('anamnesis').insert([{
                client_id: clientId,
                discovery_source: formData.discovery_source,
                answers: formData
            }]);

            if (insertError) {
                throw new Error(insertError.message || "Erro ao salvar anamnese no banco");
            }

            setSuccess(true);
        } catch (err: any) {
            console.error("Error saving anamnesis:", err);
            alert("Erro ao salvar o formulário: " + (err.message || "Tente novamente."));
        } finally {
            setSubmitting(false);
        }"""

content = content.replace(old_submit, new_submit)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
