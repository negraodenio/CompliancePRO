import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Building2, User, Mail, Phone, MessageSquare, Check, ArrowRight, Lock } from 'lucide-react';

interface EnterpriseLeadModalProps {
  onClose: () => void;
  featureContext?: string;
}

export const EnterpriseLeadModal: React.FC<EnterpriseLeadModalProps> = ({ onClose, featureContext }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    message: featureContext ? `Tenho interesse no recurso: ${featureContext}` : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simula captura de lead corporativo e armazena localmente
    const leads = JSON.parse(localStorage.getItem('complypro_leads') || '[]');
    leads.push({ ...formData, timestamp: new Date().toISOString() });
    localStorage.setItem('complypro_leads', JSON.stringify(leads));
    setSubmitted(true);
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
              <p className="text-[11px] text-slate-500">Governança contínua, telemetria em tempo real e ciclo de vida de IA</p>
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
              {/* Feature Highlights Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  O que está incluído na Plataforma Enterprise:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Monitoramento de Drift em Produção:</strong> Telemetria contínua de alucinações, latência e custos FinOps.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Workflow de Aprovação de Deploys:</strong> Esteira CI/CD com portão obrigatório de auditoria (Approval Gate).</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Gestão RACI de Donos de Agentes:</strong> Atribuição formal de Process Owners exigida pela ISO 42001.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-slate-700 font-bold">✦</span>
                    <span><strong>Notificação Automática ANPD / EU:</strong> Gestão e resposta a incidentes de segurança com IA em 72h.</span>
                  </div>
                </div>
              </div>

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
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer transition-all"
                  >
                    <span>Solicitar Demonstração Executiva</span>
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
