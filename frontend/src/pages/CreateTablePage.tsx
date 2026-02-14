import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTable } from '../api';

export default function CreateTablePage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const table = await createTable({ name: name.trim() });
      navigate(`/t/${table.shareToken}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen bg-neutral-900 text-neutral-100">
      <nav className="mb-4">
        <Link to="/" className="text-sm font-medium text-[#646cff] hover:text-[#535bf2]">
          ShareTable
        </Link>
        {' · '}
        <Link to="/create" className="text-sm font-medium text-[#646cff] hover:text-[#535bf2]">
          Create Table
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold mb-2">Create Table</h1>
      <p className="mb-4 text-neutral-400">Create a new shared table to collaborate with others.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 my-4">
        <input
          type="text"
          placeholder="Table name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={255}
          className="flex-1 max-w-[300px] px-4 py-2.5 rounded-lg border border-[#646cff] bg-neutral-800 text-inherit text-base"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-5 py-2.5 rounded-lg border border-transparent font-medium bg-neutral-800 hover:border-[#646cff] cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Table'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
