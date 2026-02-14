import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTable, addRow, deleteRow, updateCells, addColumn, updateColumn, deleteColumn, deleteTable } from '../api';
import { useTableWebSocket } from '../hooks/useTableWebSocket';
import type { TableResponse } from '../types';

const COLUMN_TYPES = ['string', 'number', 'date', 'enum'] as const;

function getCellColumnType(col: { type?: string; enumValues?: string[] }): string {
  const t = col.type || 'string';
  return COLUMN_TYPES.includes(t as typeof COLUMN_TYPES[number]) ? t : 'string';
}

export default function TableViewPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<TableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<string>('string');
  const [newColumnEnumValues, setNewColumnEnumValues] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const [editColumnType, setEditColumnType] = useState('');
  const [editColumnEnumValues, setEditColumnEnumValues] = useState('');
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
    const type = newColumnType || 'string';
    const enumValues = (type === 'enum' && newColumnEnumValues.trim())
      ? newColumnEnumValues.split(',').map((v) => v.trim()).filter(Boolean)
      : undefined;
    try {
      await addColumn(shareToken, { name: newColumnName.trim(), type, enumValues });
      setNewColumnName('');
      setNewColumnType('string');
      setNewColumnEnumValues('');
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
    } finally {
      setMutating(false);
    }
  }

  function startEditColumn(col: { id: string; name: string; type: string; enumValues?: string[] }) {
    setEditingColumnId(col.id);
    setEditColumnName(col.name);
    setEditColumnType(COLUMN_TYPES.includes(col.type as typeof COLUMN_TYPES[number]) ? col.type : 'string');
    setEditColumnEnumValues(col.enumValues?.join(', ') ?? '');
  }

  function cancelEditColumn() {
    setEditingColumnId(null);
  }

  async function handleUpdateColumn() {
    if (!shareToken || !editingColumnId) return;
    setMutating(true);
    setError(null);
    const type = editColumnType || 'string';
    const enumValues = (type === 'enum' && editColumnEnumValues.trim())
      ? editColumnEnumValues.split(',').map((v) => v.trim()).filter(Boolean)
      : [];
    try {
      await updateColumn(shareToken, editingColumnId, {
        name: editColumnName.trim(),
        type,
        enumValues: type === 'enum' ? enumValues : [],
      });
      setEditingColumnId(null);
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column');
    } finally {
      setMutating(false);
    }
  }

  async function handleDeleteColumn(columnId: string) {
    if (!shareToken) return;
    if (!confirm('Delete this column? All cell data in this column will be removed.')) return;
    setMutating(true);
    setError(null);
    try {
      await deleteColumn(shareToken, columnId);
      fetchTable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column');
    } finally {
      setMutating(false);
    }
  }

  async function handleDeleteTable() {
    if (!shareToken) return;
    if (!confirm('Delete this table? It can be recovered from the database.')) return;
    setMutating(true);
    setError(null);
    try {
      await deleteTable(shareToken);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
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
      <nav>
        <Link to="/">My Tables</Link>
        {' · '}
        <Link to="/create">Create Table</Link>
      </nav>
      <div className="table-header">
        <h1>{table.name}</h1>
        <button
          type="button"
          className="delete-btn delete-table-btn"
          onClick={handleDeleteTable}
          disabled={mutating}
          title="Delete table"
        >
          Delete table
        </button>
      </div>
      <p className="share-link">
        Share: <a href={window.location.href}>{window.location.href}</a>
        {' '}
        <button type="button" className="copy-btn" onClick={copyShareLink} title="Copy link">Copy</button>
      </p>
      {error && <p className="error">{error}</p>}
      <div className="table-actions">
        <button onClick={handleAddRow} disabled={mutating}>{mutating ? '...' : 'Add Row'}</button>
        <div className="add-column add-column-with-type">
          <input
            type="text"
            placeholder="Column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
          />
          <select
            value={newColumnType}
            onChange={(e) => setNewColumnType(e.target.value)}
            className="column-type-select"
            title="Column type"
          >
            {COLUMN_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {newColumnType === 'enum' && (
            <input
              type="text"
              placeholder="Enum values (comma-separated)"
              value={newColumnEnumValues}
              onChange={(e) => setNewColumnEnumValues(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              className="enum-values-input"
            />
          )}
          <button onClick={handleAddColumn} disabled={!newColumnName.trim() || mutating}>Add Column</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col.id} className="column-header">
                  {editingColumnId === col.id ? (
                    <div className="column-edit-form">
                      <input
                        type="text"
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        placeholder="Name"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateColumn()}
                      />
                      <select
                        value={editColumnType}
                        onChange={(e) => setEditColumnType(e.target.value)}
                        className="column-type-select"
                      >
                        {COLUMN_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {editColumnType === 'enum' && (
                        <input
                          type="text"
                          value={editColumnEnumValues}
                          onChange={(e) => setEditColumnEnumValues(e.target.value)}
                          placeholder="Enum (comma-separated)"
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateColumn()}
                        />
                      )}
                      <button type="button" onClick={handleUpdateColumn} disabled={mutating}>Save</button>
                      <button type="button" className="cancel-btn" onClick={cancelEditColumn}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span>{col.name}</span>
                      <span className="column-type-badge">{getCellColumnType(col)}</span>
                      <div className="column-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEditColumn(col)}
                          title="Edit column"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete-btn"
                          onClick={() => handleDeleteColumn(col.id)}
                          disabled={mutating}
                          title="Delete column"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </th>
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
                  const colType = getCellColumnType(col);
                  const isEnum = colType === 'enum' && col.enumValues && col.enumValues.length > 0;
                  return (
                    <td key={col.id}>
                      {isEditing ? (
                        isEnum ? (
                          <select
                            autoFocus
                            value={value}
                            onChange={(e) => handleCellSave(row.id, col.id, e.target.value)}
                            className="cell-select"
                          >
                            <option value="">—</option>
                            {col.enumValues!.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : colType === 'number' ? (
                          <input
                            type="number"
                            defaultValue={value}
                            autoFocus
                            onBlur={(e) => handleCellSave(row.id, col.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellSave(row.id, col.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="cell-input"
                          />
                        ) : colType === 'date' ? (
                          <input
                            type="date"
                            defaultValue={value}
                            autoFocus
                            onBlur={(e) => handleCellSave(row.id, col.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellSave(row.id, col.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="cell-input"
                          />
                        ) : (
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
                            className="cell-input"
                          />
                        )
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
