import type { StakeholderId } from '../simulation/types';

const portraits: Record<StakeholderId, { skin: string; hair: string; helmet: string; vest: string; bg: string; hairStyle: 'short' | 'braids' | 'close' | 'waves' | 'bun' | 'headset' }> = {
  'site-manager': { skin: '#8a563d', hair: '#201814', helmet: '#f4f1e8', vest: '#f2b63d', bg: '#e7ddd1', hairStyle: 'braids' },
  hse: { skin: '#684332', hair: '#171310', helmet: '#f3efe6', vest: '#d9d743', bg: '#dce4db', hairStyle: 'close' },
  foreman: { skin: '#6f4938', hair: '#241914', helmet: '#386b9b', vest: '#ef7b36', bg: '#ded8d0', hairStyle: 'short' },
  qs: { skin: '#9b6546', hair: '#251815', helmet: '#f0ede5', vest: '#e0ad38', bg: '#e5d9cc', hairStyle: 'bun' },
  consultant: { skin: '#784b38', hair: '#2b1c17', helmet: '#f6f3eb', vest: '#e6b843', bg: '#dde2e5', hairStyle: 'waves' },
  supplier: { skin: '#81513a', hair: '#241711', helmet: '#2d3439', vest: '#87959d', bg: '#ded9d4', hairStyle: 'headset' },
};

export function StakeholderPortrait({ id, name, size = 64 }: { id: StakeholderId; name: string; size?: number }) {
  const p = portraits[id];
  return (
    <svg className="stakeholder-portrait" role="img" aria-label={`${name} portrait`} viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="22" fill={p.bg} />
      <path d="M18 100c2-20 13-31 32-31s30 11 32 31" fill={p.vest} />
      <path d="M44 63h12v16H44z" fill={p.skin} />
      <ellipse cx="50" cy="43" rx="24" ry="28" fill={p.skin} />
      <ellipse cx="26" cy="44" rx="4" ry="7" fill={p.skin} /><ellipse cx="74" cy="44" rx="4" ry="7" fill={p.skin} />
      {p.hairStyle !== 'headset' && <path d="M27 34c2-17 13-25 24-25 14 0 23 9 24 26-8-7-16-10-24-10-9 0-17 3-24 9z" fill={p.hair} />}
      {p.hairStyle === 'braids' && <><path d="M29 30c-4 11-5 23-2 34" stroke={p.hair} strokeWidth="4" strokeLinecap="round" /><path d="M71 30c4 11 5 23 2 34" stroke={p.hair} strokeWidth="4" strokeLinecap="round" /></>}
      {p.hairStyle === 'bun' && <circle cx="70" cy="19" r="9" fill={p.hair} />}
      <path d="M28 28c4-13 14-20 22-20s19 7 22 20" fill={p.helmet} /><path d="M24 29h52" stroke={p.helmet} strokeWidth="6" strokeLinecap="round" />
      <path d="M35 42c3-2 6-2 9 0M56 42c3-2 6-2 9 0" stroke="#2b211d" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="40" cy="45" rx="2.2" ry="2.6" fill="#171513" /><ellipse cx="60" cy="45" rx="2.2" ry="2.6" fill="#171513" />
      <path d="M50 47c-1 5-2 8-1 10 2 1 4 1 6 0" fill="none" stroke="#633c2f" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M42 62c5 4 11 4 16 0" fill="none" stroke="#71382f" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 84l12 16M71 84L59 100" stroke="#f0e5bc" strokeWidth="3" opacity=".85" />
      {p.hairStyle === 'headset' && <><path d="M27 38c0-18 10-27 23-27s23 9 23 27" fill="none" stroke="#2d3439" strokeWidth="5" /><rect x="22" y="39" width="8" height="16" rx="4" fill="#2d3439" /><rect x="70" y="39" width="8" height="16" rx="4" fill="#2d3439" /><path d="M76 51c8 2 8 8 2 11" fill="none" stroke="#2d3439" strokeWidth="2" /></>}
    </svg>
  );
}
