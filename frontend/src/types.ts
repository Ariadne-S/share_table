export interface ColumnResponse {
  id: string;
  name: string;
  type: string;
  order: number;
  enumValues?: string[];
}

export interface RowResponse {
  id: string;
  order: number;
  cells: Record<string, string>;
}

export interface TableResponse {
  id: string;
  shareToken: string;
  name: string;
  createdAt: string;
  columns: ColumnResponse[];
  rows: RowResponse[];
}

export interface TableSummaryResponse {
  id: string;
  shareToken: string;
  name: string;
  createdAt: string;
  createdByName?: string | null;
  modifiedAt?: string | null;
  modifiedByName?: string | null;
}

export interface CreateTableRequest {
  name: string;
  columns?: { name: string; type?: string; order?: number }[];
}

export interface PresenceViewer {
  userId: string;
  displayName: string;
}

export interface PresenceActiveEdit {
  userId: string;
  displayName: string;
  rowId: string;
  columnId: string;
}

export interface PresenceUpdate {
  viewers: PresenceViewer[];
  activeEdits?: PresenceActiveEdit[];
}
