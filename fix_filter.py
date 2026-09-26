import sys

with open('src/pages/Clients.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '  const [search, setSearch] = useState("");\n  const [selectedClient, setSelectedClient] = useState<Client | null>(null);',
    '  const [search, setSearch] = useState("");\n  const [filterStatus, setFilterStatus] = useState<string>("all");\n  const [showFilters, setShowFilters] = useState(false);\n  const [selectedClient, setSelectedClient] = useState<Client | null>(null);'
)

content = content.replace(
    '  const filtered = clients.filter((c) =>\n    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)\n  );',
    '  const filtered = clients.filter((c) =>\n    (c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) &&\n    (filterStatus === "all" || c.status === filterStatus)\n  );'
)

with open('src/pages/Clients.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
