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
      navigate(`/t/${table.shareToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <nav><Link to="/">ShareTable</Link></nav>
      <h1>ShareTable</h1>
      <p>Create a new shared table to collaborate with others.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Table name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={255}
        />
        <button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Creating...' : 'Create Table'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
