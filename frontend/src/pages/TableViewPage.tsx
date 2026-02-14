import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTable, addRow, deleteRow, updateCells, addColumn } from '../api';
import { useTableWebSocket } from '../hooks/useTableWebSocket';
import type { TableResponse } from '../types';

export default function TableViewPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [table, setTable] = useState<TableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [mutating, setMutating] = useState(false);

  const fetchTable = useCallback(() => {
    if (!shareToken) return;
    getTable(shareToken)
      .then(setTable)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  useEffect(() => fetchTable(), [fetchTable]);

  const handleTableUpdate = useCallback((updated: TableResponse) => {
    setTable(updated);
  }, []);

  useTableWebSocket(shareToken ?? '', handleTableUpdate);

  async function handleAddRow() {
    if (!shareToken) return;
    setMutating(true);
    setError(null);
    try {
      await addRow(shareToken);
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add row');
    } finally {
      setMutating(false);
    }
  }

  async function handleDeleteRow(rowId: string) {
    if (!shareToken) return;
    setMutating(true);
    setError(null);
    try {
      await deleteRow(shareToken, rowId);
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    } finally {
      setMutating(false);
    }
  }

  async function handleCellSave(rowId: string, columnId: string, value: string) {
    if (!shareToken) return;
    setEditingCell(null);
    try {
      await updateCells(shareToken, rowId, { [columnId]: value });
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      setEditingCell({ rowId, columnId });
    }
  }

  async function handleAddColumn() {
    if (!shareToken || !newColumnName.trim()) return;
    setMutating(true);
    setError(null);
    try {
      await addColumn(shareToken, { name: newColumnName.trim() });
      setNewColumnName('');
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
    } finally {
      setMutating(false);
    }
  }

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!table) return <div className="page">Not found</div>;

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="page">
      <nav><Link to="/">ShareTable</Link></nav>
      <h1>{table.name}</h1>
      <p className="share-link">
        Share: <a href={window.location.href}>{window.location.href}</a>
        {' '}
        <button type="button" className="copy-btn" onClick={copyShareLink} title="Copy link">Copy</button>
      </p>
      {error && <p className="error">{error}</p>}
      <div className="table-actions">
        <button onClick={handleAddRow} disabled={mutating}>{mutating ? '...' : 'Add Row'}</button>
        <div className="add-column">
          <input
            type="text"
            placeholder="New column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
          />
          <button onClick={handleAddColumn} disabled={!newColumnName.trim() || mutating}>Add Column</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col.id}>{col.name}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id}>
                {table.columns.map((col) => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === col.id;
                  const value = row.cells[col.id] ?? '';
                  return (
                    <td key={col.id}>
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={value}
                          autoFocus
                          onBlur={(e) => handleCellSave(row.id, col.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellSave(row.id, col.id, (e.target as HTMLInputElement).value);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="editable-cell"
                          onClick={() => setEditingCell({ rowId: row.id, columnId: col.id })}
                        >
                          {value || '\u00a0'}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteRow(row.id)}
                    title="Delete row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={(table.columns.length || 1) + 1}>No rows yet. Click "Add Row" to start.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
