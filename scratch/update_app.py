import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_pattern = r'(import NotFound from "\./pages/NotFound";)'
if 'Courses' not in content:
    content = re.sub(imports_pattern, r'\1\nimport Courses from "./pages/Courses";\nimport Mentorship from "./pages/Mentorship";', content)

# Add routes
routes_pattern = r'(<Route path="/perfil" element={<Profile />} />)'
if '/cursos' not in content:
    content = re.sub(routes_pattern, r'\1\n              <Route path="/cursos" element={<Courses />} />\n              <Route path="/mentorias" element={<Mentorship />} />', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("App.tsx updated")
