with open('../src/web/components/AppShell.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

target = """                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sair da Conta</span>
                  </button>"""

replacement = """                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                      onNavigateToLanding?.();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sair da Conta</span>
                  </button>"""

if target in text:
    text = text.replace(target, replacement)
    with open('../src/web/components/AppShell.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated AppShell.tsx logout handler with onNavigateToLanding')
else:
    print('Target not found in AppShell.tsx')
