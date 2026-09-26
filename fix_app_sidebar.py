import sys

with open('src/components/AppSidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import {\n  LayoutDashboard,', 'import {\n  LayoutDashboard,\n  Settings as SettingsIcon,')

target_dropdown = """              <DropdownMenuItem
                onSelect={() => navigate("/perfil")}
                className="p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>"""

replacement_dropdown = """              <DropdownMenuItem
                onSelect={() => navigate("/perfil")}
                className="p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => navigate("/configuracoes")}
                className="p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Configuração do Sistema</span>
              </DropdownMenuItem>"""

if target_dropdown in content:
    content = content.replace(target_dropdown, replacement_dropdown)
    with open('src/components/AppSidebar.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('AppSidebar success')
else:
    print('AppSidebar target not found')
