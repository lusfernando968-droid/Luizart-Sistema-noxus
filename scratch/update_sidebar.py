import re

with open('src/components/AppSidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_pattern = r'(Megaphone,)'
if 'GraduationCap' not in content:
    content = re.sub(imports_pattern, r'\1\n  GraduationCap,\n  Target,', content)

# Add navItems
nav_items_pattern = r'(\{ title: "Financeiro", path: "/financeiro", icon: DollarSign \},)'
if 'Cursos' not in content:
    content = re.sub(nav_items_pattern, r'\1\n    { title: "Cursos", path: "/cursos", icon: GraduationCap },\n    { title: "Mentorias", path: "/mentorias", icon: Target },', content)

with open('src/components/AppSidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("AppSidebar.tsx updated")
