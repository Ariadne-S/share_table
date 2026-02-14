import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTables, deleteTable } from '../api';
import type { TableSummaryResponse } from '../types';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TablesListPage() {
  const [tables, setTables] = useState<TableSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTables = useCallback(() => {
    getTables()
      .then(setTables)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load tables'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => fetchTables(), [fetchTables]);

  async function handleDelete(e: React.MouseEvent, shareToken: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this table? It can be recovered from the database.')) return;
    setDeletingId(shareToken);
    setError(null);
    try {
      await deleteTable(shareToken);
      fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;

  return (
    <div className="page">
      <nav>
        <Link to="/">ShareTable</Link>
        {' · '}
        <Link to="/create">Create Table</Link>
      </nav>
      <h1>My Tables</h1>
      <p>Tables you&apos;ve created. Click to open and collaborate.</p>
      {tables.length === 0 ? (
        <p className="empty-message">No tables yet. <Link to="/create">Create your first table</Link>.</p>
      ) : (
        <ul className="tables-list">
          {tables.map((t) => (
            <li key={t.id} className="table-list-item">
              <Link to={`/t/${t.shareToken}`} className="table-link">
                <span className="table-name">{t.name}</span>
                <span className="table-date">{formatDate(t.createdAt)}</span>
              </Link>
              <button
                type="button"
                className="delete-btn"
                onClick={(e) => handleDelete(e, t.shareToken)}
                disabled={deletingId === t.shareToken}
                title="Delete table"
              >
                {deletingId === t.shareToken ? '…' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
