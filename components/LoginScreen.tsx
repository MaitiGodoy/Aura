import React, { useState } from 'react';
import { MemorySystem } from '../services/memorySystem';
import { UserProfile } from '../types';
import { SoundService } from '../services/soundEffects';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    SoundService.playClick();
    
    let result;
    if (isRegisterMode) {
        result = MemorySystem.registerLocalUser(username, password);
    } else {
        result = MemorySystem.authenticateLocalUser(username, password);
    }

    if (result.success && result.user) {
      setErrorMsg('');
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.error || 'Erro de autenticação');
    }
  };

  const toggleMode = () => {
      SoundService.playClick();
      setIsRegisterMode(!isRegisterMode);
      setErrorMsg('');
      setUsername('');
      setPassword('');
  };

  return (
    <div className="h-full w-full bg-[#030303] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Grid & Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-sm text-center space-y-8">
        
        {/* LOGO */}
        <div className="relative mb-8">
            <h1 className="text-6xl md:text-8xl font-display font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,215,0,0.6)] transform -rotate-2">
                AURA
            </h1>
            <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-black text-[10px] md:text-xs px-2 py-1 transform rotate-12 border-2 border-white shadow-lg">
                V11.0 O.S.
            </div>
        </div>

        <div className="mb-4">
            <h2 className="text-white font-tech text-xl tracking-widest uppercase">
                {isRegisterMode ? 'Criar Identidade Neural' : 'Acesso ao Motor Aura'}
            </h2>
            <p className="text-gray-500 font-mono text-[10px] uppercase mt-2">
                {isRegisterMode ? 'Inicializando Grafo de Estado (Zero Amnésia)' : 'Sincronizando Sessão de Estudo'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-3">
              <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-purple-600 rounded blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                  <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="NOME DE USUÁRIO"
                      className="relative w-full bg-black border border-gray-800 p-4 text-center text-white font-tech tracking-widest text-sm uppercase rounded focus:border-yellow-500 focus:outline-none transition-all placeholder-gray-700"
                  />
              </div>

              <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-purple-600 rounded blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                  <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRegisterMode ? "CRIAR SENHA SECRETA" : "SUA SENHA"}
                      className="relative w-full bg-black border border-gray-800 p-4 text-center text-white font-tech tracking-widest text-sm rounded focus:border-yellow-500 focus:outline-none transition-all placeholder-gray-700"
                  />
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse mt-2">
                {errorMsg}
              </p>
            )}

            <button 
                type="submit"
                className="relative group overflow-hidden bg-yellow-500 text-black font-black py-4 rounded hover:scale-[1.02] transition-all flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] w-full mt-6"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shine_1s_infinite]"></div>
                <span className="text-sm tracking-widest uppercase">
                    {isRegisterMode ? 'Registrar & Entrar' : 'Estabelecer Conexão'}
                </span>
            </button>
        </form>

        <div className="pt-6 border-t border-gray-800/50">
            <button 
                type="button" 
                onClick={toggleMode}
                className="text-gray-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
            >
                {isRegisterMode ? 'Já tem uma identidade? Fazer Login' : 'Não tem uma conta? Cadastre-se'}
            </button>
        </div>

      </div>
      
      <style>{`
        @keyframes shine {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;