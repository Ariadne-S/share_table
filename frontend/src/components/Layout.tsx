import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { getUserName, setUserName } from '../userStorage';

export function Layout({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState(getUserName() ?? '');
  const [editing, setEditing] = useState(false);

  const handleBlur = useCallback(() => {
    setEditing(false);
    setUserName(name || null);
  }, [name]);

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen bg-bg text-fg">
      <nav className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-2 flex-wrap">
          <Link
            to="/"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            ShareTable
          </Link>
          {' · '}
          <Link
            to="/create"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Create Table
          </Link>
          <span className="text-muted text-sm">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                placeholder="Your name"
                className="ml-2 px-2 py-0.5 text-sm rounded border border-border bg-bg w-32"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="ml-2 text-accent hover:text-accent-hover"
                title="Set your display name for collaboration"
              >
                {name ? `as ${name}` : 'Set your name'}
              </button>
            )}
          </span>
        </span>
        <ThemeToggle />
      </nav>
      {children}
    </div>
  );
}
