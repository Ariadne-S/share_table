export interface ColumnResponse {
  id: string;
  name: string;
  type: string;
  order: number;
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

export interface CreateTableRequest {
  name: string;
  columns?: { name: string; type?: string; order?: number }[];
}
