import React, { useState, useEffect } from 'react';
import { MemorySystem } from '../services/memorySystem';
import { SupabaseService } from '../services/supabase';
import { UserProfile } from '../types';
import { SoundService } from '../services/soundEffects';

interface Props {
  onLogin: (user: UserProfile, isHandsFree: boolean) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [hypeText, setHypeText] = useState("START YOUR JOURNEY");
  const [handsFree, setHandsFree] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const supabaseAvailable = SupabaseService.isAvailable();

  useEffect(() => {
    const messages = [
      "START YOUR JOURNEY", "LET'S PRACTICE",
      "NO BORING CLASSES", "FOCUS & LEARN",
      "ARE YOU READY?", "LET'S GO 🚀"
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setHypeText(messages[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    SoundService.playClick();
    const user = MemorySystem.createSessionUser(name || 'STUDENT', 'AUTO', 'PHASE_0');
    if (supabaseAvailable) SupabaseService.saveProfile({ name: name || 'STUDENT' });
    onLogin(user, handsFree);
  };

  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) return;
    setAuthLoading(true);
    setAuthError(null);

    const fn = isSignUp ? SupabaseService.signUp : SupabaseService.signIn;
    const { user, error } = await fn(authEmail.trim(), authPassword);

    if (error) {
      setAuthError(error);
      setAuthLoading(false);
      return;
    }

    const profile = await SupabaseService.loadProfile();
    const userName = profile?.name || authEmail.split('@')[0].toUpperCase();
    await SupabaseService.saveProfile({ name: userName });

    SoundService.playClick();
    const localUser = MemorySystem.createSessionUser(userName, 'AUTO', 'PHASE_0');
    setAuthLoading(false);
    onLogin(localUser, handsFree);
  };

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-start p-6 relative overflow-y-auto pt-20">
      <div className="z-10 w-full max-w-lg text-center space-y-8 pb-10">
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-display font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(0,255,255,0.3)] transform -rotate-2">
            AURA
          </h1>
          <div className="absolute -top-4 -right-4 bg-transparent text-cyan-400 font-bold text-[10px] md:text-xs px-2 py-1 transform rotate-12 border border-cyan shadow-lg" style={{borderColor: '#00FFFF', color: '#00FFFF'}}>
            ADL v1
          </div>
        </div>

        {showAuth && supabaseAvailable ? (
          <div className="space-y-4">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="EMAIL"
                type="email"
                className="relative w-full bg-black/80 border border-gray-800 p-4 text-center text-white font-bold text-lg rounded-lg focus:border-blue-500 focus:outline-none transition-all placeholder-gray-700"
              />
            </div>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="PASSWORD"
                type="password"
                className="relative w-full bg-black/80 border border-gray-800 p-4 text-center text-white font-bold text-lg rounded-lg focus:border-blue-500 focus:outline-none transition-all placeholder-gray-700"
              />
            </div>

            {authError && <p className="text-red-400 text-xs font-mono">{authError}</p>}

            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg uppercase tracking-widest disabled:opacity-50"
            >
              {authLoading ? '...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>

            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
              className="text-xs text-gray-500 hover:text-blue-400 transition-colors font-mono uppercase tracking-wider"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'New here? Create account'}
            </button>

            <button
              onClick={() => setShowAuth(false)}
              className="text-[10px] text-gray-600 hover:text-white transition-colors font-mono uppercase tracking-widest"
            >
              ← Back to guest
            </button>
          </div>
        ) : (
          <>
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg blur opacity-25" style={{background: 'linear-gradient(135deg, #00FFFF, #E6E6FA)'}}></div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
                placeholder="YOUR NAME"
                className="relative w-full bg-black border p-4 text-center text-white font-bold text-xl uppercase rounded-lg focus:outline-none transition-all placeholder-gray-700"
                style={{borderColor: '#00FFFF33', borderWidth: '1px'}}
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-black text-cyan-400 font-black py-6 rounded-xl hover:bg-cyan-900 hover:text-white active:scale-95 transition-all shadow-lg uppercase tracking-widest text-lg border-2"
              style={{borderColor: '#00FFFF', color: '#00FFFF'}}
            >
              {hypeText}
            </button>

            <div className="flex flex-col gap-2 pt-2">
              <label className="flex items-center justify-center gap-3 cursor-pointer group bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-6 py-4 border border-white/5 hover:border-blue-500/30">
                <input
                  type="checkbox"
                  checked={handsFree}
                  onChange={(e) => setHandsFree(e.target.checked)}
                  className="w-5 h-5 accent-blue-500 bg-black border-gray-700 rounded cursor-pointer"
                />
                <div className="text-left">
                  <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-widest">
                    Hands-Free 🎧
                  </span>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    No screen needed — pure audio coaching
                  </p>
                </div>
              </label>
            </div>

            {supabaseAvailable && (
              <button
                onClick={() => setShowAuth(true)}
                className="text-[10px] text-gray-600 hover:text-blue-400 transition-colors font-mono uppercase tracking-widest"
              >
                Sign in with email →
              </button>
            )}
          </>
        )}

        <div className="flex justify-center items-center gap-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest pt-4">
          <span className="flex items-center gap-1">🎤 Mic</span>
          <span className="flex items-center gap-1 text-blue-400">☁️ Nebula</span>
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
