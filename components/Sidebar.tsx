import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Terminal', href: '/terminal' },
    { name: 'Agent', href: '/agent' },
    { name: 'Bulk Trades', href: '/bulk' },
    { name: 'History', href: '/history' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="fixed top-0 left-0 w-[240px] h-screen bg-[#0F0F1A] border-r border-[#2A2A42] flex flex-col z-20">
      <div className="h-[52px] flex items-center px-4 shrink-0">
        <span className="font-mono font-bold text-[18px] text-[#7B5CF0]">KLUB</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname === '/' && link.href === '/dashboard');
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-[10px] rounded-[6px] text-sm font-sans transition-colors ${
                isActive ? 'bg-[#1E1E32] text-[#7B5CF0]' : 'text-[#8888AA] hover:bg-[#1E1E32] hover:text-[#EEEEFF]'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1A1A2E]">
        <WalletMultiButton style={{ width: '100%', justifyContent: 'center', backgroundColor: '#1E1E32', border: '1px solid #2A2A42', fontSize: '12px', height: '40px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
      </div>
    </div>
  );
}
