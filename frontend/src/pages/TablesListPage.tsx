import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTables, deleteTable } from '../api';
import { TableListSkeleton } from '../components/Skeleton';
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

  async function handleDelete(e: React.MouseEvent, t: TableSummaryResponse) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this table? It can be recovered from the database.')) return;
    setDeletingId(t.shareToken);
    setError(null);
    try {
      await deleteTable(t.shareToken);
      setTables((prev) => prev.filter((x) => x.shareToken !== t.shareToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="text-3xl font-semibold mb-2">My Tables</h1>
        <p className="mb-4 text-muted">Tables you&apos;ve created. Click to open and collaborate.</p>
        <TableListSkeleton />
      </>
    );
  }
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <>
      <h1 className="text-3xl font-semibold mb-2 text-fg">My Tables</h1>
      <p className="mb-4 text-muted">Tables you&apos;ve created. Click to open and collaborate.</p>
      {tables.length === 0 ? (
        <p className="mt-4 text-muted">
          No tables yet. <Link to="/create" className="text-accent hover:text-accent-hover">Create your first table</Link>.
        </p>
      ) : (
        <ul className="list-none p-0 m-0">
          {tables.map((t) => (
            <li key={t.id} className="flex items-center gap-2 mb-2">
              <Link
                to={`/t/${t.shareToken}`}
                className="flex-1 flex justify-between items-center px-4 py-3 rounded-lg border border-border no-underline text-fg hover:bg-accent/10 hover:border-accent transition-colors"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-muted">{formatDate(t.createdAt)}</span>
              </Link>
              <button
                type="button"
                className="shrink-0 py-1 px-2 text-lg leading-none bg-transparent text-muted hover:text-red-500 hover:border-red-500 rounded"
                onClick={(e) => handleDelete(e, t)}
                disabled={deletingId === t.shareToken}
                title="Delete table"
              >
                {deletingId === t.shareToken ? '…' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
