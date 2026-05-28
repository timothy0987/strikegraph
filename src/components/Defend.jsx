import React from 'react';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';

const Defend = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/60 backdrop-blur-md">
      <div className="glass-panel p-8 w-[600px] flex flex-col gap-6 text-center relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,95,31,0.15)]">
        {/* Decorative corner glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#FF5F1F]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neonPink/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-[#FF5F1F]/10 rounded-full border border-[#FF5F1F]/20 text-[#FF5F1F] animate-pulse">
            <Shield size={48} />
          </div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5F1F] to-neonPink tracking-widest uppercase">
            Defend Mode
          </h2>
          <span className="px-4 py-1 text-xs font-black bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/30 rounded-full uppercase tracking-wider">
            Coming Soon
          </span>
        </div>

        <div className="flex flex-col gap-4 mt-4 text-left border-y border-white/5 py-6">
          <div className="flex gap-4 items-start">
            <div className="text-neonPink mt-1">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Stake-to-Defend Economy</h4>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Mint Goalkeeper NFTs to earn passive yield on House saves.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start mt-2">
            <div className="text-[#00FFFF] mt-1">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Earn Passive Yield</h4>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Whenever your goalkeeper NFTs save a penalty kick against other players, a percentage of their stake is paid directly to your wallet.
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-2 font-mono uppercase tracking-widest">
          StrikeGraph Phase 2 Roadmap
        </p>
      </div>
    </div>
  );
};

export default Defend;
