import React from 'react';

// Small "Powered by X1 EcoChain" chip used across menus so the chain identity is
// always visible. Links out to the X1 explorer for the deployed store contract.
import { STRIKEGRAPH_STORE_ADDRESS } from '../config/contract';

const EXPLORER = 'https://maculatus-scan.x1eco.com';
const isDeployed = /^0x[0-9a-fA-F]{40}$/.test(STRIKEGRAPH_STORE_ADDRESS) &&
  STRIKEGRAPH_STORE_ADDRESS !== '0x0000000000000000000000000000000000000000';

const X1Badge = ({ className = '' }) => {
  const href = isDeployed
    ? `${EXPLORER}/address/${STRIKEGRAPH_STORE_ADDRESS}`
    : EXPLORER;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-x1Green/40 bg-x1Green/10 text-x1GreenBright text-[10px] font-mono uppercase tracking-widest hover:border-x1Green hover:bg-x1Green/20 transition-colors pointer-events-auto ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-x1GreenBright shadow-[0_0_6px_#7dd320] animate-pulse" />
      Powered by X1 EcoChain
    </a>
  );
};

export default X1Badge;
