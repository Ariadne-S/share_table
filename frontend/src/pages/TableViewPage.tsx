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

const inputBase = 'w-full min-w-[80px] py-1 px-2 rounded border border-[#646cff] bg-neutral-800 text-inherit';

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 min-h-screen bg-neutral-900 text-neutral-100">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 min-h-screen bg-neutral-900 text-neutral-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  if (!table) {
    return (
      <div className="max-w-4xl mx-auto p-8 min-h-screen bg-neutral-900 text-neutral-100">
        Not found
      </div>
    );
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen bg-neutral-900 text-neutral-100">
      <nav className="mb-4">
        <Link to="/" className="text-sm font-medium text-[#646cff] hover:text-[#535bf2]">
          My Tables
        </Link>
        {' · '}
        <Link to="/create" className="text-sm font-medium text-[#646cff] hover:text-[#535bf2]">
          Create Table
        </Link>
      </nav>
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-semibold m-0">{table.name}</h1>
        <button
          type="button"
          className="text-sm py-1.5 px-3 rounded bg-transparent text-neutral-400 hover:text-red-500 hover:border-red-500 border border-transparent disabled:opacity-50"
          onClick={handleDeleteTable}
          disabled={mutating}
          title="Delete table"
        >
          Delete table
        </button>
      </div>
      <p className="text-sm text-neutral-400 mb-4 break-all">
        Share: <a href={window.location.href} className="text-[#646cff] hover:text-[#535bf2]">{window.location.href}</a>
        {' '}
        <button
          type="button"
          className="text-sm py-1 px-2 ml-2 rounded border border-[#646cff]"
          onClick={copyShareLink}
          title="Copy link"
        >
          Copy
        </button>
      </p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex gap-4 items-center mb-4 flex-wrap">
        <button
          onClick={handleAddRow}
          disabled={mutating}
          className="px-4 py-2 rounded-lg border border-transparent font-medium bg-neutral-800 hover:border-[#646cff] cursor-pointer disabled:opacity-50"
        >
          {mutating ? '...' : 'Add Row'}
        </button>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            className="w-40 px-4 py-2 rounded-lg border border-[#646cff] bg-neutral-800 text-sm"
          />
          <select
            value={newColumnType}
            onChange={(e) => setNewColumnType(e.target.value)}
            className="w-24 px-2 py-2 rounded-lg border border-[#646cff] bg-neutral-800 text-inherit text-sm"
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
              className="w-52 px-4 py-2 rounded-lg border border-[#646cff] bg-neutral-800 text-sm"
            />
          )}
          <button
            onClick={handleAddColumn}
            disabled={!newColumnName.trim() || mutating}
            className="px-4 py-2 rounded-lg border border-transparent font-medium bg-neutral-800 hover:border-[#646cff] cursor-pointer disabled:opacity-50"
          >
            Add Column
          </button>
        </div>
      </div>
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col.id} className="relative min-w-[120px] border border-neutral-600 px-3 py-2 text-left bg-neutral-800 font-semibold">
                  {editingColumnId === col.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        placeholder="Name"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateColumn()}
                        className="py-1 px-2 rounded border border-[#646cff] bg-neutral-900 text-sm"
                      />
                      <select
                        value={editColumnType}
                        onChange={(e) => setEditColumnType(e.target.value)}
                        className="py-1 px-2 rounded border border-[#646cff] bg-neutral-900 text-sm"
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
                          className="py-1 px-2 rounded border border-[#646cff] bg-neutral-900 text-sm"
                        />
                      )}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleUpdateColumn}
                          disabled={mutating}
                          className="px-2 py-1 text-sm rounded border border-[#646cff] bg-neutral-800"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditColumn}
                          className="px-2 py-1 text-sm rounded border border-neutral-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>{col.name}</span>
                      <span className="block text-[0.7rem] font-normal text-neutral-400 mt-0.5">
                        {getCellColumnType(col)}
                      </span>
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        <button
                          type="button"
                          className="p-1 text-sm leading-none bg-transparent text-neutral-400 hover:text-[#646cff] hover:bg-[#646cff]/15 rounded"
                          onClick={() => startEditColumn(col)}
                          title="Edit column"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="p-1 text-sm leading-none bg-transparent text-neutral-400 hover:text-red-500 rounded disabled:opacity-50"
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
              <th className="border border-neutral-600 px-3 py-2 bg-neutral-800" />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#646cff]/5">
                {table.columns.map((col) => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === col.id;
                  const value = row.cells[col.id] ?? '';
                  const colType = getCellColumnType(col);
                  const isEnum = colType === 'enum' && col.enumValues && col.enumValues.length > 0;
                  return (
                    <td key={col.id} className="border border-neutral-600 px-3 py-2">
                      {isEditing ? (
                        isEnum ? (
                          <select
                            autoFocus
                            value={value}
                            onChange={(e) => handleCellSave(row.id, col.id, e.target.value)}
                            className={`${inputBase} cursor-pointer`}
                          >
                            <option value="">—</option>
                            {col.enumValues!.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={colType === 'number' ? 'number' : colType === 'date' ? 'date' : 'text'}
                            defaultValue={value}
                            autoFocus
                            onBlur={(e) => handleCellSave(row.id, col.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellSave(row.id, col.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className={inputBase}
                          />
                        )
                      ) : (
                        <span
                          className="block cursor-pointer min-h-[1.5em] py-0.5 px-1 hover:bg-[#646cff]/15 rounded"
                          onClick={() => setEditingCell({ rowId: row.id, columnId: col.id })}
                        >
                          {value || '\u00a0'}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border border-neutral-600 px-3 py-2">
                  <button
                    className="py-1 px-2 text-lg leading-none bg-transparent text-neutral-400 hover:text-red-500 hover:border-red-500 rounded border border-transparent"
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
                <td
                  colSpan={(table.columns.length || 1) + 1}
                  className="border border-neutral-600 px-3 py-2 text-neutral-400"
                >
                  No rows yet. Click &quot;Add Row&quot; to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
