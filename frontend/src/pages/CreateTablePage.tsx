import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <>
      <h1 className="text-3xl font-semibold mb-2 text-fg">Create Table</h1>
      <p className="mb-4 text-muted">Create a new shared table to collaborate with others.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 my-4">
        <input
          type="text"
          placeholder="Table name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={255}
          className="flex-1 max-w-[300px] px-4 py-2.5 rounded-lg border border-accent bg-input text-fg text-base"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-5 py-2.5 rounded-lg border border-transparent font-medium bg-input hover:border-accent cursor-pointer disabled:opacity-50 text-fg"
        >
          {loading ? 'Creating...' : 'Create Table'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </>
  );
}
