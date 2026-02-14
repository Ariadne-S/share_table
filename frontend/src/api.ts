import type { ColumnResponse, RowResponse, TableResponse, TableSummaryResponse } from './types';

const API_BASE = import.meta.env.DEV ? '/api' : '/api';

export async function getTables(): Promise<TableSummaryResponse[]> {
  const res = await fetch(`${API_BASE}/tables`);
  if (!res.ok) throw new Error('Failed to fetch tables');
  return res.json();
}

export async function createTable(request: { name: string; columns?: { name: string; type?: string; order?: number }[] }): Promise<TableResponse> {
  const res = await fetch(`${API_BASE}/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Failed to create table: ${res.statusText}`);
  return res.json();
}

export async function getTable(shareToken: string): Promise<TableResponse> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}`);
  if (!res.ok) throw new Error(`Failed to fetch table: ${res.statusText}`);
  return res.json();
}

export async function deleteTable(shareToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete table: ${res.statusText}`);
}

export async function addRow(shareToken: string): Promise<RowResponse> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}/rows`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to add row: ${res.statusText}`);
  return res.json();
}

export async function deleteRow(shareToken: string, rowId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}/rows/${rowId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete row: ${res.statusText}`);
}

export async function updateCells(shareToken: string, rowId: string, cells: Record<string, string>): Promise<RowResponse> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}/rows/${rowId}/cells`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cells }),
  });
  if (!res.ok) throw new Error(`Failed to update cells: ${res.statusText}`);
  return res.json();
}

export async function addColumn(shareToken: string, column: { name: string; type?: string; order?: number }): Promise<ColumnResponse> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(column),
  });
  if (!res.ok) throw new Error(`Failed to add column: ${res.statusText}`);
  return res.json();
}

export async function deleteColumn(shareToken: string, columnId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tables/${shareToken}/columns/${columnId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete column: ${res.statusText}`);
}
