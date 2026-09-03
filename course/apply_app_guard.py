with open('../src/web/App.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# 1. Update import
text = text.replace(
    "import { AuthProvider } from './context/AuthContext';",
    "import { AuthProvider, useAuth } from './context/AuthContext';"
)

# 2. Add AuthSessionGuard component definition right above export const App
guard_def = """interface AuthSessionGuardProps {
  pageMode: 'landing' | 'app';
  onForceLanding: () => void;
  children: React.ReactNode;
}

const AuthSessionGuard: React.FC<AuthSessionGuardProps> = ({
  pageMode,
  onForceLanding,
  children
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // If user is in app mode and authentication is lost (e.g. logout or token expired), immediately return to landing
    if (pageMode === 'app' && !isAuthenticated && !isLoading) {
      onForceLanding();
    }
  }, [pageMode, isAuthenticated, isLoading, onForceLanding]);

  return <>{children}</>;
};

export const App: React.FC = () => {"""

text = text.replace("export const App: React.FC = () => {", guard_def)

# 3. Wrap RoleLensProvider children with AuthSessionGuard and update onNavigateToLanding
old_jsx_block = """          <RoleLensProvider onNavigate={(view) => setActiveView(view)}>
            {pageMode === 'landing' ? ("""

new_jsx_block = """          <RoleLensProvider onNavigate={(view) => setActiveView(view)}>
            <AuthSessionGuard
              pageMode={pageMode}
              onForceLanding={() => {
                setPageMode('landing');
                setActiveView('overview-center');
              }}
            >
              {pageMode === 'landing' ? ("""

text = text.replace(old_jsx_block, new_jsx_block)

old_appshell_tag = """              <AppShell 
                activeView={activeView} 
                setActiveView={setActiveView}
                totalAgentsCount={totalAgentsCount}
                criticalGapsCount={criticalGapsCount}
                onNavigateToLanding={() => setPageMode('landing')}
              >"""

new_appshell_tag = """              <AppShell 
                activeView={activeView} 
                setActiveView={setActiveView}
                totalAgentsCount={totalAgentsCount}
                criticalGapsCount={criticalGapsCount}
                onNavigateToLanding={() => {
                  setPageMode('landing');
                  setActiveView('overview-center');
                }}
              >"""

text = text.replace(old_appshell_tag, new_appshell_tag)

old_closing = """                {showAcademy && <AcademyModal onClose={() => setShowAcademy(false)} />}
              </AppShell>
            )}
          </RoleLensProvider>"""

new_closing = """                {showAcademy && <AcademyModal onClose={() => setShowAcademy(false)} />}
              </AppShell>
            )}
            </AuthSessionGuard>
          </RoleLensProvider>"""

text = text.replace(old_closing, new_closing)

with open('../src/web/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('App.tsx successfully updated with AuthSessionGuard and reset handler')
