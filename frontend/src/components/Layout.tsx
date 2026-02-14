import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen bg-bg text-fg">
      <nav className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <span>
          <Link to="/" className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
            ShareTable
          </Link>
          {' · '}
          <Link to="/create" className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
            Create Table
          </Link>
        </span>
        <ThemeToggle />
      </nav>
      {children}
    </div>
  );
}
