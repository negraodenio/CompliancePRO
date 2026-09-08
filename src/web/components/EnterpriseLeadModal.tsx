import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Building2, User, Mail, Phone, MessageSquare, Check, ArrowRight, Lock } from 'lucide-react';

interface EnterpriseLeadModalProps {
  onClose: () => void;
  featureContext?: string;
}

export const EnterpriseLeadModal: React.FC<EnterpriseLeadModalProps> = ({ onClose, featureContext }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'CISO',
    company: '',
    email: '',
    phone: '',
    message: featureContext ? `Tenho interesse no recurso: ${featureContext}` : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiBase}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          role: formData.role || 'CISO',
          interest: featureContext || 'enterprise_suite',
          source: 'enterprise_lead_modal',
          notes: `${formData.phone ? 'Telefone: ' + formData.phone + ' | ' : ''}${formData.message}`.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Não foi possível registrar o contato no momento. Por favor, tente novamente.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de conexão ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <Sparkles className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>ComplyPRO Enterprise Governance Suite</span>
                <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono font-bold">
                  Enterprise
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Governança estrutural, portões CI/CD pré-deploy e auditoria de IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-700 font-sans leading-relaxed">
          
          {submitted ? (
            <div className="p-8 text-center space-y-4 bg-slate-50 rounded-2xl border border-emerald-200 animate-in zoom-in-95">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Solicitação Recebida com Sucesso!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Nossa equipe de consultores em Governança de IA entrará em contato em até <strong>2 horas úteis</strong> pelo email <strong>{formData.email}</strong> para agendar sua demonstração personalizada.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Voltar para o Scanner
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Feature Highlights Grid - Defensible Capabilities */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  O que está incluído na Plataforma Enterprise:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Avaliação Arquitetural Pré-Deploy:</strong> Mapeamento de riscos, modelos de IA e controle de dependências.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Workflow de Aprovação de Deploys:</strong> Esteira CI/CD com portão obrigatório de auditoria (Approval Gate).</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Gestão RACI de Donos de Agentes:</strong> Atribuição formal de Process Owners e custódia técnica ISO 42001.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Pacote de Evidências Regulatórias:</strong> Relatórios formais RIPD/DPIA e conformidade com EU AI Act & LGPD.</span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-800 font-bold text-xs ml-2 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>Nome Completo:</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Juliana Silveira"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Empresa / Organização:</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: FinTech Brasil S/A"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span>Email Corporativo:</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="juliana@empresa.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Telefone / WhatsApp:</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+55 (11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                    <span>Objetivo / Desafio de Governança:</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Conte brevemente o contexto da sua organização..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Seus dados estão protegidos sob nossa Política de Privacidade.
                  </span>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <span>{loading ? 'Registrando...' : 'Solicitar Demonstração Executiva'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
