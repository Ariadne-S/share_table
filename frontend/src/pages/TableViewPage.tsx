import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTable,
  addRow,
  deleteRow,
  updateCells,
  addColumn,
  updateColumn,
  deleteColumn,
  deleteTable,
  reorderColumns,
} from '../api';
import { CollaboratorPresence } from '../components/CollaboratorPresence';
import { TableViewSkeleton } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useTableWebSocket } from '../hooks/useTableWebSocket';
import { getUserId } from '../userStorage';
import type { ColumnResponse, PresenceUpdate, RowResponse, TableResponse } from '../types';

const COLUMN_TYPES = [
  'string',
  'number',
  'date',
  'datetime',
  'time',
  'boolean',
  'url',
  'email',
  'currency',
  'enum',
] as const;

function getCellColumnType(col: { type?: string; enumValues?: string[] }): string {
  const t = col.type || 'string';
  return COLUMN_TYPES.includes(t as (typeof COLUMN_TYPES)[number]) ? t : 'string';
}

const inputBase = 'w-full min-w-[80px] py-1 px-2 rounded border border-[#646cff] bg-input text-fg';

function exportCSV(table: TableResponse): string {
  const headers = table.columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',');
  const rows = table.rows.map((r) =>
    table.columns.map((c) => `"${(r.cells[c.id] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [headers, ...rows].join('\n');
}

function exportJSON(table: TableResponse): string {
  return JSON.stringify(
    {
      name: table.name,
      columns: table.columns.map((c) => ({ name: c.name, type: c.type })),
      rows: table.rows.map((r) =>
        Object.fromEntries(table.columns.map((c) => [c.name, r.cells[c.id] ?? '']))
      ),
    },
    null,
    2
  );
}

export default function TableViewPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [table, setTable] = useState<TableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<string>('string');
  const [newColumnEnumValues, setNewColumnEnumValues] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const [editColumnType, setEditColumnType] = useState('');
  const [editColumnEnumValues, setEditColumnEnumValues] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [mutating, setMutating] = useState(false);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUpdate | null>(null);

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

  const { connectionState, publishEditing } = useTableWebSocket(
    shareToken ?? '',
    handleTableUpdate,
    { onPresence: setPresence }
  );

  useEffect(() => {
    publishEditing(editingCell?.rowId ?? null, editingCell?.columnId ?? null);
  }, [editingCell, publishEditing]);

  useEffect(() => {
    if (connectionState === 'error') {
      toast.showToast('Connection lost. Reconnecting…', { duration: 5000 });
    }
  }, [connectionState, toast]);

  const performCellSave = useCallback(
    async (rowId: string, columnId: string, value: string, closeEditor: boolean) => {
      if (!shareToken) return;
      if (closeEditor) setEditingCell(null);
      try {
        await updateCells(shareToken, rowId, { [columnId]: value });
        fetchTable();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update';
        setError(msg);
        toast.showToast(msg, { duration: 5000 });
        if (closeEditor) setEditingCell({ rowId, columnId });
      }
    },
    [shareToken, fetchTable, toast]
  );

  const debouncedCellSave = useDebouncedCallback(
    (rowId: string, columnId: string, value: string) =>
      performCellSave(rowId, columnId, value, false),
    400
  );

  const handleCellSave = useCallback(
    (rowId: string, columnId: string, value: string, closeEditor = false) => {
      if (closeEditor) {
        debouncedCellSave.cancel();
        performCellSave(rowId, columnId, value, true);
      } else {
        debouncedCellSave(rowId, columnId, value);
      }
    },
    [debouncedCellSave, performCellSave]
  );

  const handleAddRow = useCallback(async () => {
    if (!shareToken) return;
    setMutating(true);
    setError(null);
    try {
      await addRow(shareToken);
      fetchTable();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add row';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
    } finally {
      setMutating(false);
    }
  }, [shareToken, fetchTable, toast]);

  async function handleDeleteRow(row: RowResponse) {
    if (!shareToken || !table) return;
    const cells = { ...row.cells };
    setMutating(true);
    setError(null);
    try {
      await deleteRow(shareToken, row.id);
      setTable((prev) =>
        prev ? { ...prev, rows: prev.rows.filter((r) => r.id !== row.id) } : prev
      );
      toast.showToast('Row deleted', {
        action: {
          label: 'Undo',
          onAction: async () => {
            try {
              const added = await addRow(shareToken);
              await updateCells(shareToken, added.id, cells);
              fetchTable();
            } catch {
              toast.showToast('Failed to restore row');
            }
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete row';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
    } finally {
      setMutating(false);
    }
  }

  async function handleAddColumn() {
    if (!shareToken || !newColumnName.trim()) return;
    setMutating(true);
    setError(null);
    const type = newColumnType || 'string';
    const enumValues =
      type === 'enum' && newColumnEnumValues.trim()
        ? newColumnEnumValues
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : undefined;
    try {
      await addColumn(shareToken, { name: newColumnName.trim(), type, enumValues });
      setNewColumnName('');
      setNewColumnType('string');
      setNewColumnEnumValues('');
      fetchTable();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add column';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
    } finally {
      setMutating(false);
    }
  }

  function startEditColumn(col: ColumnResponse) {
    setEditingColumnId(col.id);
    setEditColumnName(col.name);
    setEditColumnType(
      COLUMN_TYPES.includes(col.type as (typeof COLUMN_TYPES)[number]) ? col.type : 'string'
    );
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
    const enumValues =
      editColumnType === 'enum' && editColumnEnumValues.trim()
        ? editColumnEnumValues
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
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
      const msg = err instanceof Error ? err.message : 'Failed to update column';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
    } finally {
      setMutating(false);
    }
  }

  async function handleDeleteColumn(col: ColumnResponse) {
    if (!shareToken || !table) return;
    if (!confirm('Delete this column? All cell data in this column will be removed.')) return;
    const colCopy = { name: col.name, type: col.type, enumValues: [...(col.enumValues ?? [])] };
    setMutating(true);
    setError(null);
    try {
      await deleteColumn(shareToken, col.id);
      setTable((prev) =>
        prev ? { ...prev, columns: prev.columns.filter((c) => c.id !== col.id) } : prev
      );
      toast.showToast('Column deleted', {
        action: {
          label: 'Undo',
          onAction: async () => {
            try {
              await addColumn(shareToken, colCopy);
              fetchTable();
            } catch {
              toast.showToast('Failed to restore column');
            }
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete column';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
    } finally {
      setMutating(false);
    }
  }

  async function handleReorderColumns(newColumnIds: string[]) {
    if (!shareToken) return;
    setMutating(true);
    setError(null);
    try {
      await reorderColumns(shareToken, newColumnIds);
      setTable((prev) => {
        if (!prev) return prev;
        const orderMap = Object.fromEntries(newColumnIds.map((id, i) => [id, i]));
        const sorted = [...prev.columns].sort(
          (a, b) => (orderMap[a.id] ?? 0) - (orderMap[b.id] ?? 0)
        );
        return { ...prev, columns: sorted };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reorder columns';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
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
      const msg = err instanceof Error ? err.message : 'Failed to delete table';
      setError(msg);
      toast.showToast(msg, { duration: 5000 });
    } finally {
      setMutating(false);
    }
  }

  const filteredRows = useMemo(() => {
    if (!table || !filterQuery.trim()) return table?.rows ?? [];
    const q = filterQuery.toLowerCase().trim();
    return table.rows.filter((row) =>
      table.columns.some((c) => (row.cells[c.id] ?? '').toLowerCase().includes(q))
    );
  }, [table, filterQuery]);

  const myUserId = getUserId();
  const othersEditingCell = useMemo(() => {
    const edits = presence?.activeEdits ?? [];
    return (rowId: string, columnId: string) =>
      edits.find((e) => e.rowId === rowId && e.columnId === columnId && e.userId !== myUserId);
  }, [presence?.activeEdits, myUserId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAddRow();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAddRow]);

  if (loading) {
    return (
      <>
        <TableViewSkeleton />
      </>
    );
  }
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
  if (!table) {
    return <p className="text-fg">Not found</p>;
  }

  const tableData = table;

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  function handleExport(format: 'csv' | 'json') {
    const data = format === 'csv' ? exportCSV(tableData) : exportJSON(tableData);
    const blob = new Blob([data], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableData.name.replace(/[^a-z0-9]/gi, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startEditCell(row: RowResponse, col: ColumnResponse) {
    setEditingCell({ rowId: row.id, columnId: col.id });
    setCellValue(row.cells[col.id] ?? '');
  }

  const cols = [...tableData.columns];

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <h1 className="text-3xl font-semibold m-0 text-fg">{tableData.name}</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            className="text-sm py-1.5 px-3 rounded bg-transparent text-muted hover:text-red-500 hover:border-red-500 border border-transparent disabled:opacity-50"
            onClick={handleDeleteTable}
            disabled={mutating}
            title="Delete table"
          >
            Delete table
          </button>
          <button
            type="button"
            className="text-sm py-1.5 px-3 rounded border border-border bg-input hover:border-accent text-fg"
            onClick={() => handleExport('csv')}
            title="Export CSV"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="text-sm py-1.5 px-3 rounded border border-border bg-input hover:border-accent text-fg"
            onClick={() => handleExport('json')}
            title="Export JSON"
          >
            Export JSON
          </button>
        </div>
      </div>
      <p className="text-sm text-muted mb-4 break-all">
        Share:{' '}
        <a href={window.location.href} className="text-accent hover:text-accent-hover">
          {window.location.href}
        </a>{' '}
        <span className="mx-2">·</span>
        <CollaboratorPresence presence={presence} connectionState={connectionState} />
        <button
          type="button"
          className="text-sm py-1 px-2 ml-2 rounded border border-accent"
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
          className="px-4 py-2 rounded-lg border border-transparent font-medium bg-input hover:border-accent cursor-pointer disabled:opacity-50 text-fg"
          title="Add row (Ctrl+Enter)"
        >
          {mutating ? '...' : 'Add Row'}
        </button>
        <input
          type="text"
          placeholder="Filter rows..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-40 px-4 py-2 rounded-lg border border-accent bg-input text-fg text-sm"
          title="Filter rows by cell content"
        />
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            className="w-40 px-4 py-2 rounded-lg border border-accent bg-input text-fg text-sm"
          />
          <select
            value={newColumnType}
            onChange={(e) => setNewColumnType(e.target.value)}
            className="w-24 px-2 py-2 rounded-lg border border-accent bg-input text-fg text-sm"
            title="Column type"
          >
            {COLUMN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {newColumnType === 'enum' && (
            <input
              type="text"
              placeholder="Enum values (comma-separated)"
              value={newColumnEnumValues}
              onChange={(e) => setNewColumnEnumValues(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              className="w-52 px-4 py-2 rounded-lg border border-accent bg-input text-fg text-sm"
            />
          )}
          <button
            onClick={handleAddColumn}
            disabled={!newColumnName.trim() || mutating}
            className="px-4 py-2 rounded-lg border border-transparent font-medium bg-input hover:border-accent cursor-pointer disabled:opacity-50 text-fg"
          >
            Add Column
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[70vh] mt-4">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-input border-b border-border shadow-sm">
            <tr>
              {cols.map((col) => (
                <th
                  key={col.id}
                  draggable
                  onDragStart={() => setDraggedColId(col.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedColId && draggedColId !== col.id) setDragOverColId(col.id);
                  }}
                  onDragLeave={() => setDragOverColId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedColId || draggedColId === col.id) return;
                    const fromIdx = cols.findIndex((c) => c.id === draggedColId);
                    const toIdx = cols.findIndex((c) => c.id === col.id);
                    if (fromIdx < 0 || toIdx < 0) return;
                    const newOrder = [...cols];
                    const [removed] = newOrder.splice(fromIdx, 1);
                    newOrder.splice(toIdx, 0, removed);
                    handleReorderColumns(newOrder.map((c) => c.id));
                    setDraggedColId(null);
                    setDragOverColId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedColId(null);
                    setDragOverColId(null);
                  }}
                  className={`relative min-w-[120px] border px-3 py-2 text-left font-semibold select-none cursor-grab active:cursor-grabbing ${
                    dragOverColId === col.id
                      ? 'border-accent bg-accent/20'
                      : 'border-border bg-input text-fg'
                  } ${draggedColId === col.id ? 'opacity-50' : ''}`}
                >
                  <span className="inline-block mr-1" title="Drag to reorder">
                    ⋮⋮
                  </span>
                  {editingColumnId === col.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        placeholder="Name"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateColumn()}
                        className="py-1 px-2 rounded border border-accent bg-bg text-fg text-sm"
                      />
                      <select
                        value={editColumnType}
                        onChange={(e) => setEditColumnType(e.target.value)}
                        className="py-1 px-2 rounded border border-accent bg-bg text-fg text-sm"
                      >
                        {COLUMN_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {editColumnType === 'enum' && (
                        <input
                          type="text"
                          value={editColumnEnumValues}
                          onChange={(e) => setEditColumnEnumValues(e.target.value)}
                          placeholder="Enum (comma-separated)"
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateColumn()}
                          className="py-1 px-2 rounded border border-accent bg-bg text-fg text-sm"
                        />
                      )}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleUpdateColumn}
                          disabled={mutating}
                          className="px-2 py-1 text-sm rounded border border-accent bg-input"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditColumn}
                          className="px-2 py-1 text-sm rounded border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>{col.name}</span>
                      <span className="block text-[0.7rem] font-normal text-muted mt-0.5">
                        {getCellColumnType(col)}
                      </span>
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        <button
                          type="button"
                          className="p-1 text-sm leading-none bg-transparent text-muted hover:text-accent hover:bg-accent/15 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditColumn(col);
                          }}
                          title="Edit column"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="p-1 text-sm leading-none bg-transparent text-muted hover:text-red-500 rounded disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteColumn(col);
                          }}
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
              <th className="border border-border px-3 py-2 bg-input" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-accent/5">
                {tableData.columns.map((col) => {
                  const isEditing =
                    editingCell?.rowId === row.id && editingCell?.columnId === col.id;
                  const value = row.cells[col.id] ?? '';
                  const colType = getCellColumnType(col);
                  const isEnum = colType === 'enum' && col.enumValues && col.enumValues.length > 0;
                  const otherEditing = othersEditingCell(row.id, col.id);
                  return (
                    <td
                      key={col.id}
                      className={`border border-border px-3 py-2 ${
                        otherEditing ? 'ring-2 ring-amber-400 ring-inset bg-amber-500/10' : ''
                      }`}
                      title={
                        otherEditing
                          ? `${otherEditing.displayName || 'Someone'} is editing`
                          : undefined
                      }
                    >
                      {isEditing ? (
                        isEnum ? (
                          <select
                            autoFocus
                            value={cellValue}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCellValue(v);
                              handleCellSave(row.id, col.id, v, true);
                            }}
                            onBlur={() => setEditingCell(null)}
                            className={`${inputBase} cursor-pointer`}
                          >
                            <option value="">—</option>
                            {col.enumValues!.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : colType === 'boolean' ? (
                          <select
                            autoFocus
                            value={cellValue}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCellValue(v);
                              handleCellSave(row.id, col.id, v, true);
                            }}
                            onBlur={() => setEditingCell(null)}
                            className={`${inputBase} cursor-pointer`}
                          >
                            <option value="">—</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : (
                          <input
                            type={
                              colType === 'number' || colType === 'currency'
                                ? 'number'
                                : colType === 'date'
                                  ? 'date'
                                  : colType === 'datetime'
                                    ? 'datetime-local'
                                    : colType === 'time'
                                      ? 'time'
                                      : colType === 'url'
                                        ? 'url'
                                        : colType === 'email'
                                          ? 'email'
                                          : 'text'
                            }
                            step={colType === 'currency' ? '0.01' : undefined}
                            value={cellValue}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCellValue(v);
                              handleCellSave(row.id, col.id, v);
                            }}
                            onBlur={(e) => handleCellSave(row.id, col.id, e.target.value, true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellSave(
                                  row.id,
                                  col.id,
                                  (e.target as HTMLInputElement).value,
                                  true
                                );
                              }
                              if (e.key === 'Escape') setEditingCell(null);
                              if (e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (colType === 'string') {
                                  const input = e.target as HTMLInputElement;
                                  const start = input.selectionStart ?? input.value.length;
                                  const end = input.selectionEnd ?? input.value.length;
                                  const newValue =
                                    input.value.slice(0, start) + ' ' + input.value.slice(end);
                                  setCellValue(newValue);
                                  handleCellSave(row.id, col.id, newValue);
                                  setTimeout(() => input.setSelectionRange(start + 1, start + 1));
                                }
                              }
                            }}
                            autoFocus
                            className={inputBase}
                          />
                        )
                      ) : (
                        <span
                          className="block cursor-pointer min-h-[1.5em] py-0.5 px-1 hover:bg-accent/15 rounded text-fg"
                          onClick={() =>
                            colType === 'boolean'
                              ? handleCellSave(
                                  row.id,
                                  col.id,
                                  value === 'true' || value === 'yes' || value === '1'
                                    ? 'false'
                                    : 'true',
                                  true
                                )
                              : startEditCell(row, col)
                          }
                        >
                          {colType === 'boolean'
                            ? value === 'true' || value === 'yes' || value === '1'
                              ? '✓'
                              : value === 'false' || value === 'no' || value === '0'
                                ? '☐'
                                : value || '\u00a0'
                            : colType === 'url' && value.trim()
                              ? (() => {
                                  const href = value.startsWith('http')
                                    ? value
                                    : `https://${value}`;
                                  return (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-accent hover:text-accent-hover underline"
                                    >
                                      {value}
                                    </a>
                                  );
                                })()
                              : colType === 'currency' && value.trim()
                                ? (() => {
                                    const n = Number.parseFloat(value);
                                    return Number.isNaN(n)
                                      ? value
                                      : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  })()
                                : value || '\u00a0'}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border border-border px-3 py-2">
                  <button
                    className="py-1 px-2 text-lg leading-none bg-transparent text-muted hover:text-red-500 hover:border-red-500 rounded border border-transparent disabled:opacity-50"
                    onClick={() => handleDeleteRow(row)}
                    title="Delete row"
                    disabled={mutating}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={(tableData.columns.length || 1) + 1}
                  className="border border-border px-3 py-2 text-muted"
                >
                  {filterQuery.trim()
                    ? 'No rows match the filter.'
                    : 'No rows yet. Click "Add Row" or press Ctrl+Enter to start.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
