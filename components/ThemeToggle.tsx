'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-[2px] bg-[#1B1A14] dark:bg-[#1B1A14] light:bg-[#F5F5F0] border border-[#2A2620] hover:border-[#FFB547] transition-all flex items-center justify-center group"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={14} className="text-[#736A6C] group-hover:text-[#FFB547]" />
      ) : (
        <Moon size={14} className="text-[#736A6C] group-hover:text-[#FFB547]" />
      )}
    </button>
  );
}
