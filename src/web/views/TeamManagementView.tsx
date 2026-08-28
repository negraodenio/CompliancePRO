import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  AlertTriangle, 
  Building2, 
  KeyRound, 
  Crown,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EnterpriseRole } from '../../server/security/identity-types';

interface MemberItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_owner: boolean;
  admin_role: string;
  enterprise_role: EnterpriseRole;
  created_at: string;
}

interface InvitationItem {
  id: string;
  email: string;
  enterprise_role: EnterpriseRole;
  admin_role: string;
  token_hash: string;
  raw_token?: string;
  status: string;
  expires_at: string;
}

export const TeamManagementView: React.FC = () => {
  const { activeOrganization, isOwner, adminRole, token } = useAuth();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Invite Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<EnterpriseRole>('ENGINEER');
  const [inviteAdminRole, setInviteAdminRole] = useState<'member' | 'admin'>('member');
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
  const orgId = activeOrganization?.id || '';

  const canManage = isOwner || adminRole === 'owner' || adminRole === 'admin';

  const fetchMembersAndInvites = async () => {
    if (!orgId || !token) return;
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Organization-Id': orgId
      };

      // 1. Fetch members
      const memRes = await fetch(`${apiBase}/api/v1/organizations/${orgId}/members`, { headers });
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData);
      }

      // 2. Fetch invitations
      const invRes = await fetch(`${apiBase}/api/v1/organizations/${orgId}/invitations`, { headers });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData);
      }
    } catch (err) {
      console.warn('Could not fetch team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndInvites();
  }, [orgId, token]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !orgId) return;

    try {
      const res = await fetch(`${apiBase}/api/v1/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          email: inviteEmail,
          enterprise_role: inviteRole,
          admin_role: inviteAdminRole
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro ao gerar convite' }));
        throw new Error(err.detail);
      }

      const data = await res.json();
      const rawToken = data.invitation?.raw_token || '';
      const fullLink = `${window.location.origin}/join?token=${rawToken}`;
      setCreatedInviteLink(fullLink);
      setMessage({ type: 'success', text: `Convite gerado para ${inviteEmail}` });
      setInviteEmail('');
      fetchMembersAndInvites();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao criar convite.' });
    }
  };

  const handleUpdateRole = async (userId: string, newEnterpriseRole: EnterpriseRole) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/organizations/${orgId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({ enterprise_role: newEnterpriseRole })
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar papel');
      }

      setMessage({ type: 'success', text: 'Cargo do colaborador atualizado com sucesso!' });
      fetchMembersAndInvites();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este membro da organização?')) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/organizations/${orgId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Organization-Id': orgId
        }
      });

      if (!res.ok) {
        throw new Error('Falha ao remover membro');
      }

      setMessage({ type: 'success', text: 'Membro removido com sucesso.' });
      fetchMembersAndInvites();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/organizations/${orgId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Organization-Id': orgId
        }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Convite revogado com sucesso.' });
        fetchMembersAndInvites();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Falha ao revogar convite.' });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Team Management & Access Governance
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Gerencie colaboradores da organização <strong className="text-slate-800 dark:text-slate-200">{activeOrganization?.name}</strong>, atribua Enterprise Roles (CISO, DPO, Auditor, Engenheiro) e controle permissões RBAC.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <span className="text-slate-400">Plano:</span> <span className="text-sky-500 uppercase font-bold">{activeOrganization?.planTier || 'FREE'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{members.length} Membro(s) Ativo(s)</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Invite Member Section (Only for Owner / Admin) */}
      {canManage ? (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Convidar Novo Colaborador
            </h2>
          </div>

          <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Enterprise Role (Cargo)
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as EnterpriseRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
              >
                <option value="CISO">🛡️ CISO & Risk Officer</option>
                <option value="DPO">⚖️ Data Protection Officer (DPO)</option>
                <option value="AI_OFFICE">🏛️ AI Office</option>
                <option value="SECURITY_LEAD">🔐 Security Lead</option>
                <option value="ENGINEER">💻 AI & Software Engineer</option>
                <option value="AUDITOR">🔍 Independent Auditor</option>
                <option value="BOARD">📊 Board / Executive</option>
                <option value="VIEWER">👁️ Viewer (Read-only)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <span>Gerar Link de Convite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {createdInviteLink && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center space-x-2 truncate">
                <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate max-w-lg">
                  {createdInviteLink}
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-sky-500 transition shrink-0 cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Active Members Table */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Membros da Equipe ({members.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Enterprise Role</th>
                <th className="py-3 px-4">Nível Admin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        {m.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>{m.full_name}</span>
                          {m.is_owner && (
                            <span className="p-0.5 rounded bg-amber-500/20 text-amber-500" title="Proprietário da Organização">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{m.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {canManage && !m.is_owner ? (
                      <select
                        value={m.enterprise_role}
                        onChange={(e) => handleUpdateRole(m.user_id, e.target.value as EnterpriseRole)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="CISO">🛡️ CISO</option>
                        <option value="DPO">⚖️ DPO</option>
                        <option value="AI_OFFICE">🏛️ AI Office</option>
                        <option value="SECURITY_LEAD">🔐 Security Lead</option>
                        <option value="ENGINEER">💻 Engineer</option>
                        <option value="AUDITOR">🔍 Auditor</option>
                        <option value="BOARD">📊 Board</option>
                        <option value="VIEWER">👁️ Viewer</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono text-[11px] font-bold">
                        {m.enterprise_role}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                      m.is_owner 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                        : m.admin_role === 'admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                    }`}>
                      {m.is_owner ? 'OWNER' : m.admin_role.toUpperCase()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Ativo</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {canManage && !m.is_owner ? (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        title="Remover da Organização"
                        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Convites Pendentes ({invitations.filter(i => i.status === 'PENDING').length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Destinatário</th>
                  <th className="py-3 px-4">Cargo Atribuído</th>
                  <th className="py-3 px-4">Expira em</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {inv.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono text-[11px] font-bold">
                        {inv.enterprise_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : '7 dias'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                        inv.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManage && inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="text-xs text-rose-500 hover:underline font-medium"
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
