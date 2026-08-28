import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnterpriseRole } from '../../server/security/identity-types';
import { PersistenceAdapter } from '../services/persistence-adapter';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  adminRole?: string;
  enterpriseRole?: EnterpriseRole;
  isOwner?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  activeOrganization: OrganizationInfo | null;
  availableOrganizations: OrganizationInfo[];
  enterpriseRole: EnterpriseRole;
  adminRole: string;
  isOwner: boolean;
  isMaster: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (payload: { email: string; password: string; fullName: string; companyName: string; desiredRole: EnterpriseRole }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchOrganization: (orgId: string) => void;
  refreshProfile: () => Promise<void>;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  activeOrganization: null,
  availableOrganizations: [],
  enterpriseRole: 'CISO',
  adminRole: 'member',
  isOwner: false,
  isMaster: false,
  token: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  switchOrganization: () => {},
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cgag_auth_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationInfo | null>(null);
  const [availableOrganizations, setAvailableOrganizations] = useState<OrganizationInfo[]>([]);
  const [enterpriseRole, setEnterpriseRole] = useState<EnterpriseRole>('CISO');
  const [adminRole, setAdminRole] = useState<string>('owner');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isMaster, setIsMaster] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync PersistenceAdapter with active organization
  const syncPersistence = (orgId: string) => {
    PersistenceAdapter.setContext({
      tenantId: orgId,
      workspaceId: 'default',
      environment: 'production'
    });
  };

  const applyAuthData = (data: any) => {
    const u: UserProfile = {
      id: data.user_id,
      email: data.email,
      fullName: data.full_name || data.email?.split('@')[0] || 'User'
    };
    setUser(u);

    const activeOrg: OrganizationInfo = {
      id: data.organization_id || (data.active_organization && data.active_organization.id) || 'TENANT-DEFAULT',
      name: data.organization_name || (data.active_organization && data.active_organization.name) || 'My Workspace',
      slug: (data.active_organization && data.active_organization.slug) || 'workspace',
      planTier: data.plan_tier || (data.active_organization && data.active_organization.plan_tier) || 'free'
    };
    setActiveOrganization(activeOrg);

    const orgsList: OrganizationInfo[] = (data.organizations || []).map((o: any) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      planTier: o.plan_tier,
      adminRole: o.admin_role,
      enterpriseRole: o.enterprise_role as EnterpriseRole,
      isOwner: o.is_owner
    }));
    setAvailableOrganizations(orgsList.length > 0 ? orgsList : [activeOrg]);

    const entRole = (data.enterprise_role as EnterpriseRole) || 'CISO';
    setEnterpriseRole(entRole);
    setAdminRole(data.admin_role || 'owner');
    setIsOwner(Boolean(data.is_owner));
    setIsMaster(Boolean(data.is_master || data.email === 'negraodenio@gmail.com'));

    syncPersistence(activeOrg.id);
  };

  const refreshProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const activeOrgId = localStorage.getItem('cgag_active_org_id') || '';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      if (activeOrgId) {
        headers['X-Organization-Id'] = activeOrgId;
      }

      const res = await fetch(`${API_BASE}/api/v1/auth/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        applyAuthData({
          user_id: data.user_id,
          email: data.email,
          full_name: data.full_name,
          active_organization: data.active_organization,
          organizations: data.organizations,
          enterprise_role: data.enterprise_role,
          admin_role: data.admin_role,
          is_owner: data.is_owner,
          is_master: data.is_master
        });
      } else {
        // Clear invalid token
        logout();
      }
    } catch (err) {
      console.warn('Backend offline or unreachable, using local session state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Erro no login' }));
        return { success: false, error: errData.detail || 'Email ou senha inválidos' };
      }

      const data = await res.json();
      const authToken = data.access_token;
      setToken(authToken);
      localStorage.setItem('cgag_auth_token', authToken);
      localStorage.setItem('cgag_active_org_id', data.organization_id);

      applyAuthData(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com o servidor' };
    }
  };

  const signup = async (payload: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    desiredRole: EnterpriseRole;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          full_name: payload.fullName,
          company_name: payload.companyName,
          desired_role: payload.desiredRole
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Erro no cadastro' }));
        return { success: false, error: errData.detail || 'Não foi possível cadastrar a conta' };
      }

      const data = await res.json();
      const authToken = data.access_token;
      setToken(authToken);
      localStorage.setItem('cgag_auth_token', authToken);
      localStorage.setItem('cgag_active_org_id', data.organization_id);

      applyAuthData(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com o servidor' };
    }
  };

  const switchOrganization = (orgId: string) => {
    const target = availableOrganizations.find(o => o.id === orgId);
    if (!target) return;

    setActiveOrganization(target);
    localStorage.setItem('cgag_active_org_id', orgId);
    syncPersistence(orgId);

    if (target.enterpriseRole) {
      setEnterpriseRole(target.enterpriseRole);
    }
    if (target.adminRole) {
      setAdminRole(target.adminRole);
    }
    if (typeof target.isOwner === 'boolean') {
      setIsOwner(target.isOwner);
    }

    // Refresh data in background
    refreshProfile();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveOrganization(null);
    setAvailableOrganizations([]);
    localStorage.removeItem('cgag_auth_token');
    localStorage.removeItem('cgag_active_org_id');
    PersistenceAdapter.setContext({
      tenantId: 'TENANT-DEFAULT',
      workspaceId: 'WS-DEFAULT',
      environment: 'production'
    });
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: Boolean(token && user),
      isLoading,
      user,
      activeOrganization,
      availableOrganizations,
      enterpriseRole,
      adminRole,
      isOwner,
      isMaster,
      token,
      login,
      signup,
      logout,
      switchOrganization,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
