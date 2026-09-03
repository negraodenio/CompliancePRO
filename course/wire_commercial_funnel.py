import os

# ==============================================================================
# 1. Update AuthModal.tsx
# ==============================================================================
with open('../src/web/components/AuthModal.tsx', 'r', encoding='utf-8') as f:
    auth_text = f.read()

# Add FunnelAnalytics import
if "FunnelAnalytics" not in auth_text:
    auth_text = "import { FunnelAnalytics } from '../services/funnel-analytics';\n" + auth_text

# Update AuthModalProps
auth_props_old = """interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup' | 'invite';
  inviteToken?: string;
}"""

auth_props_new = """interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'login' | 'signup' | 'invite';
  inviteToken?: string;
}"""

auth_text = auth_text.replace(auth_props_old, auth_props_new)

# Update Component signature
old_sig = """export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  inviteToken = ''
}) => {"""

new_sig = """export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
  inviteToken = ''
}) => {"""

auth_text = auth_text.replace(old_sig, new_sig)

# Update handleLogin
old_login_success = """    if (res.success) {
      setSuccessMsg('Login realizado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 600);
    }"""

new_login_success = """    if (res.success) {
      FunnelAnalytics.track('GOVERNANCE_ENTERED', { authMode: 'login' });
      setSuccessMsg('Login realizado com sucesso!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 600);
    }"""

auth_text = auth_text.replace(old_login_success, new_login_success)

# Update handleSignup
old_signup_success = """    if (res.success) {
      setSuccessMsg('Empresa e conta criadas com sucesso!');
      setTimeout(() => {
        onClose();
      }, 800);
    }"""

new_signup_success = """    if (res.success) {
      FunnelAnalytics.track('WORKSPACE_CREATED', { desiredRole });
      FunnelAnalytics.track('GOVERNANCE_ENTERED', { authMode: 'signup' });
      setSuccessMsg('Empresa e conta criadas com sucesso!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 800);
    }"""

auth_text = auth_text.replace(old_signup_success, new_signup_success)

with open('../src/web/components/AuthModal.tsx', 'w', encoding='utf-8') as f:
    f.write(auth_text)

print('Updated AuthModal.tsx with onSuccess and analytics')


# ==============================================================================
# 2. Update FreeScanSnapshotView.tsx
# ==============================================================================
with open('../src/web/components/FreeScanSnapshotView.tsx', 'r', encoding='utf-8') as f:
    snap_text = f.read()

if "FunnelAnalytics" not in snap_text:
    snap_text = "import { useEffect } from 'react';\nimport { FunnelAnalytics } from '../services/funnel-analytics';\n" + snap_text

old_snap_mount = """  const destructiveActions = capabilities.filter(c => c.isDestructive);
  const averageScore = Math.round(result.compliance?.overallScore ?? 0);"""

new_snap_mount = """  const destructiveActions = capabilities.filter(c => c.isDestructive);
  const averageScore = Math.round(result.compliance?.overallScore ?? 0);

  useEffect(() => {
    FunnelAnalytics.track('SNAPSHOT_VIEWED', {
      agentsCount: agents.length,
      modelsCount: models.length,
      capabilitiesCount: capabilities.length,
      unknownAuthCount: totalUnknownAuth,
      complianceScore: averageScore
    });
  }, [result]);"""

if "FunnelAnalytics.track('SNAPSHOT_VIEWED'" not in snap_text:
    snap_text = snap_text.replace(old_snap_mount, new_snap_mount)

with open('../src/web/components/FreeScanSnapshotView.tsx', 'w', encoding='utf-8') as f:
    f.write(snap_text)

print('Updated FreeScanSnapshotView.tsx with SNAPSHOT_VIEWED tracking')


# ==============================================================================
# 3. Update CommercialLandingView.tsx
# ==============================================================================
with open('../src/web/views/CommercialLandingView.tsx', 'r', encoding='utf-8') as f:
    cl_text = f.read()

if "FunnelAnalytics" not in cl_text:
    cl_text = "import { FunnelAnalytics } from '../services/funnel-analytics';\n" + cl_text

# Track VISIT on mount
old_mount_needle = "  const [isDragOver, setIsDragOver] = useState(false);"
new_mount_needle = """  const [isDragOver, setIsDragOver] = useState(false);

  React.useEffect(() => {
    FunnelAnalytics.track('VISIT');
  }, []);"""

if "FunnelAnalytics.track('VISIT')" not in cl_text:
    cl_text = cl_text.replace(old_mount_needle, new_mount_needle)

# Track FREE_SCAN_CLICK
old_scroll = """  const scrollToScanner = () => {
    scannerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };"""

new_scroll = """  const scrollToScanner = () => {
    FunnelAnalytics.track('FREE_SCAN_CLICK');
    scannerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };"""

if "FunnelAnalytics.track('FREE_SCAN_CLICK')" not in cl_text:
    cl_text = cl_text.replace(old_scroll, new_scroll)

# Track PRESERVE_CLICKED on snapshot
old_govern = """            <FreeScanSnapshotView 
              result={scanResult}
              onGovernFindings={() => onOpenAuth('signup')}
              onExploreGovernanceOs={onEnterApp}
              onResetScan={onResetScan}
            />"""

new_govern = """            <FreeScanSnapshotView 
              result={scanResult}
              onGovernFindings={() => {
                FunnelAnalytics.track('PRESERVE_CLICKED');
                FunnelAnalytics.track('SIGNUP_STARTED');
                onOpenAuth('signup');
              }}
              onExploreGovernanceOs={() => {
                FunnelAnalytics.track('GOVERNANCE_ENTERED');
                onEnterApp();
              }}
              onResetScan={onResetScan}
            />"""

if "FunnelAnalytics.track('PRESERVE_CLICKED')" not in cl_text:
    cl_text = cl_text.replace(old_govern, new_govern)

with open('../src/web/views/CommercialLandingView.tsx', 'w', encoding='utf-8') as f:
    f.write(cl_text)

print('Updated CommercialLandingView.tsx with funnel tracking')


# ==============================================================================
# 4. Update App.tsx
# ==============================================================================
with open('../src/web/App.tsx', 'r', encoding='utf-8') as f:
    app_text = f.read()

if "FunnelAnalytics" not in app_text:
    app_text = "import { FunnelAnalytics } from './services/funnel-analytics';\n" + app_text

# Track SCAN_STARTED and SCAN_COMPLETED in handleScanGitHub
old_gh_scan = """  const handleScanGitHub = async (url: string) => {
    setIsScanning(true);
    setScanProgress({ message: 'Connecting to GitHub repository...', percent: 10 });
    try {
      const gitToken = localStorage.getItem('github_token') || undefined;
      const repoDetails = await fetchGitHubRepo(url, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      }, gitToken);

      setScanProgress({ message: 'Running AST analysis across 12 CG-AG controls...', percent: 85 });
      const result = await runLocalScan(repoDetails.files, {
        repoName: `${repoDetails.owner}/${repoDetails.repo}`,
        repoUrl: url,
        defaultBranch: repoDetails.defaultBranch,
      });

      setScanResult(result);
      ScanGovernanceBridge.ingestScan(result);
      setScanProgress({ message: 'Scan Complete!', percent: 100 });
      triggerConfetti();
      if (pageMode === 'app') {
        setActiveView('overview-center');
      }"""

new_gh_scan = """  const handleScanGitHub = async (url: string) => {
    setIsScanning(true);
    FunnelAnalytics.track('SCAN_STARTED', { inputType: 'github' });
    setScanProgress({ message: 'Connecting to GitHub repository...', percent: 10 });
    try {
      const gitToken = localStorage.getItem('github_token') || undefined;
      const repoDetails = await fetchGitHubRepo(url, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      }, gitToken);

      setScanProgress({ message: 'Running AST analysis across 12 CG-AG controls...', percent: 85 });
      const result = await runLocalScan(repoDetails.files, {
        repoName: `${repoDetails.owner}/${repoDetails.repo}`,
        repoUrl: url,
        defaultBranch: repoDetails.defaultBranch,
      });

      setScanResult(result);
      ScanGovernanceBridge.ingestScan(result);
      FunnelAnalytics.track('SCAN_COMPLETED', { 
        inputType: 'github', 
        fileCount: repoDetails.files.size, 
        agentCount: result.source?.agents?.length || 0 
      });
      setScanProgress({ message: 'Scan Complete!', percent: 100 });
      triggerConfetti();
      if (pageMode === 'app') {
        setActiveView('overview-center');
      }"""

app_text = app_text.replace(old_gh_scan, new_gh_scan)

# Pass onSuccess to AuthModal in App.tsx
old_auth_modal = """                {authModalMode && (
                  <AuthModal 
                    isOpen={Boolean(authModalMode)}
                    onClose={() => setAuthModalMode(null)}
                    initialTab={authModalMode}
                  />
                )}"""

new_auth_modal = """                {authModalMode && (
                  <AuthModal 
                    isOpen={Boolean(authModalMode)}
                    onClose={() => setAuthModalMode(null)}
                    onSuccess={() => {
                      setPageMode('app');
                      setActiveView('overview-center');
                    }}
                    initialTab={authModalMode}
                  />
                )}"""

app_text = app_text.replace(old_auth_modal, new_auth_modal)

with open('../src/web/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_text)

print('Updated App.tsx with scan analytics and AuthModal onSuccess transition')
