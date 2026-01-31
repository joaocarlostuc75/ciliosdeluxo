
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : loginError.message);
    } else {
      onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 relative overflow-hidden animate-in fade-in duration-700">
      <button
        onClick={onBack}
        className="absolute top-12 left-8 w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="w-full max-w-sm space-y-12 relative z-10">
        <header className="text-center">
          <div className="w-20 h-20 rounded-full border border-gold mx-auto flex items-center justify-center mb-6 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
            <span className="material-symbols-outlined text-gold text-4xl">lock</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-stone-900 dark:text-parchment-light italic">Painel do Parceiro</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mt-2">Acesso Administrativo</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold ml-1">E-mail</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 text-lg">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-white/60 dark:bg-luxury-medium/60 border-2 border-gold/10 rounded-2xl py-4 pl-12 pr-4 text-stone-700 dark:text-stone-200 focus:border-gold outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold ml-1">Senha</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 text-lg">key</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/60 dark:bg-luxury-medium/60 border-2 border-gold/10 rounded-2xl py-4 pl-12 pr-4 text-stone-700 dark:text-stone-200 focus:border-gold outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 shadow-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-white font-bold py-5 rounded-2xl shadow-xl uppercase tracking-[0.3em] text-[10px] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>

      <footer className="mt-24 opacity-40 text-[8px] uppercase tracking-widest text-stone-500 dark:text-stone-400 text-center font-bold relative z-10">
        Gestão Profissional &copy; 2026
      </footer>
    </div>
  );
};

export default AdminLogin;
