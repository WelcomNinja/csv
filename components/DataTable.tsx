'use client';
import React from 'react';
import type { ArrowTable } from '@duckdb/duckdb-wasm';

export default function DataTable({ table }: { table: ArrowTable | null }) {
  if (!table) return <div className="text-sm opacity-75">Нет данных. Выполните запрос.</div>;
  const cols = table.schema.fields.map((f:any)=>f.name);
  const rows: any[] = [];
  for (let i = 0; i < Math.min(500, table.numRows); i++) {
    rows.push(table.get(i));
  }
  return (
    <div className="overflow-auto">
      <table className="min-w-full border" cellPadding={6}>
        <thead><tr>{cols.map((c:string)=>(<th key={c} className="border text-left">{c}</th>))}</tr></thead>
        <tbody>
          {rows.map((r, idx)=>(
            <tr key={idx}>
              {cols.map((c:string)=>(<td key={c} className="border">{String(r[c])}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.numRows > 500 && <div className="text-xs opacity-60 mt-1">Показаны первые 500 строк</div>}
    </div>
  );
}
