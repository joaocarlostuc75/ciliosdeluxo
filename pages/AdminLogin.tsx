
import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
  adminPassword?: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack, adminPassword = 'admin123' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login: Admin e senha dinâmica
    if (username === 'admin' && password === adminPassword) {
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  const handleForgotPassword = () => {
    alert("Para redefinir sua senha, entre em contato com o suporte técnico do sistema ou utilize a chave mestra de recuperação presente no manual de instalação.");
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
          <h2 className="font-display text-4xl font-bold text-stone-900 dark:text-parchment-light italic">Área Restrita</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mt-2">Acesso Administrativo</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold ml-1">Usuário</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 text-lg">person</span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
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
                className="w-full bg-white/60 dark:bg-luxury-medium/60 border-2 border-gold/10 rounded-2xl py-4 pl-12 pr-4 text-stone-700 dark:text-stone-200 focus:border-gold outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 shadow-sm"
              />
            </div>
            <div className="text-right">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[9px] uppercase font-bold text-stone-400 hover:text-gold transition-colors tracking-wider"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full gold-gradient text-white font-bold py-5 rounded-2xl shadow-xl uppercase tracking-[0.3em] text-[10px] active:scale-[0.98] transition-all mt-4"
          >
            Acessar Painel
          </button>
        </form>
      </div>

      <footer className="mt-24 opacity-40 text-[8px] uppercase tracking-widest text-stone-500 dark:text-stone-400 text-center font-bold relative z-10">
        Cílios de Luxo &copy; 2026 - Sistema de Gestão Interna
      </footer>
    </div>
  );
};

export default AdminLogin;
