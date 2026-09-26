import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_import = 'import Mentorship from "./pages/Mentorship";'
replacement_import = 'import Mentorship from "./pages/Mentorship";\nimport Settings from "./pages/Settings";'

target_route = '<Route path="/mentorias" element={<Mentorship />} />'
replacement_route = '<Route path="/mentorias" element={<Mentorship />} />\n              <Route path="/configuracoes" element={<Settings />} />'

if target_import in content and target_route in content:
    content = content.replace(target_import, replacement_import)
    content = content.replace(target_route, replacement_route)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('App.tsx success')
else:
    print('App.tsx target not found')
