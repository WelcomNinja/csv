'use client';
import React from 'react';
import type { Table } from 'apache-arrow';

export default function DataTable({ table }: { table: Table | null }) {
  if (!table) return <div className="subtle">Нет данных. Выполните запрос.</div>;
  const cols = table.schema.fields.map((f:any)=>f.name);
  const rows: any[] = [];
  for (let i = 0; i < Math.min(500, table.numRows); i++) {
    rows.push(table.get(i));
  }
  return (
    <div className="overflow-auto">
      <table className="table" cellPadding={0} cellSpacing={0}>
        <thead><tr>{cols.map((c:string)=>(<th key={c}>{c}</th>))}</tr></thead>
        <tbody>
          {rows.map((r, idx)=>(
            <tr key={idx}>
              {cols.map((c:string)=>(<td key={c}>{String(r[c])}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.numRows > 500 && <div className="table-note">Показаны первые 500 строк</div>}
    </div>
  );
}
