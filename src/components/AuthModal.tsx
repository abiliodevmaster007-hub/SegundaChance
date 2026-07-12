import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ANGOLA_PROVINCES } from '../types';
import { X, Mail, Lock, User, Phone, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getApiUrl } from '../apiConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode,
  onAuthSuccess
}: AuthModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Registration States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+244 ');
  const [location, setLocation] = useState('Luanda');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const url = getApiUrl(mode === 'login' ? '/api/auth/login' : '/api/auth/register');
    const payload = mode === 'login' 
      ? { email, password }
      : { name, email, password, phone, location };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar o seu pedido');
      }

      setSuccess(mode === 'login' ? 'Sessão iniciada com sucesso!' : 'Conta criada com sucesso!');
      
      // Delay to show success animation
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
        // Reset states
        setName('');
        setEmail('');
        setPassword('');
        setPhone('+244 ');
        setError(null);
        setSuccess(null);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Lamento, ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100 flex flex-col">
        
        {/* Header decoration bar */}
        <div className="h-1.5 w-full bg-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content Wrapper */}
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Entrar na sua Conta' : 'Criar uma Conta Grátis'}
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 font-sans">
              {mode === 'login' 
                ? 'Aceda aos seus anúncios e converse com compradores.' 
                : 'Publique num instante e venda grátis para todo o país!'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-750 ring-1 ring-red-100">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Manuel da Costa"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Endereço de E-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@segundachance.ao"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Palavra-Passe
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="A sua palavra-passe"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contacto Telefónico (Angola)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone className="h-5 w-5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+244 9..."
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Província de Residência
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none bg-slate-50/50"
                    >
                      {ANGOLA_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full select-none rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 active:scale-98 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              {loading ? 'A processar...' : mode === 'login' ? 'Entrar Agora' : 'Registar Conta'}
            </button>

            {mode === 'register' && (
              <p className="text-[11px] text-slate-400 text-center leading-normal mt-3">
                Ao continuar você concorda com nossos{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/terms');
                  }}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer inline-block"
                >
                  termos e privacidades
                </button>
                .
              </p>
            )}
          </form>

          {/* Switch Mode Footer */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <span className="text-xs text-slate-500">
              {mode === 'login' ? 'Ainda não tem cadastro?' : 'Já tem um perfil SegundaChance?'}
            </span>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccess(null);
              }}
              className="ml-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              {mode === 'login' ? 'Registe-se' : 'Inicie sessão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
