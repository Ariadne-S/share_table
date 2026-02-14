import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const cycle = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };
  const label = theme === 'system' ? `System (${resolvedTheme})` : theme;
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${label}. Click to cycle.`}
      className="p-2 rounded-lg border border-border bg-input hover:border-[#646cff] text-fg text-sm transition-colors"
    >
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
