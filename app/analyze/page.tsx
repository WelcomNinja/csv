'use client';
import dynamic from 'next/dynamic';
import UploadArea from '@/components/UploadArea';
import SQLStudio from '@/components/SQLStudio';
import DataTable from '@/components/DataTable';
import ChartView from '@/components/ChartView';
import { useState, useMemo } from 'react';
import { runQueryOrPredict } from '@/lib/duck/sql';
import type { ArrowTable } from '@duckdb/duckdb-wasm';

export default function Analyze() {
  const [table, setTable] = useState<ArrowTable | null>(null);
  const [viz, setViz] = useState<'table'|'line'|'bar'>('table');

  const onRun = async (sql: string) => {
    const res = await runQueryOrPredict(sql);
    setTable(res.data ?? null);
  };

  const chartData = useMemo(() => {
    if (!table) return null;
    const cols = table.schema.fields.map((f:any)=>f.name);
    if (cols.length < 2) return null;
    const x = [], y = [];
    for (let i=0;i<table.numRows;i++) {
      const r:any = table.get(i);
      x.push(r[cols[0]]);
      y.push(Number(r[cols[1]]) || 0);
    }
    return { x, y };
  }, [table]);

  return (
    <main className="space-y-6">
      <section className="p-4 rounded-2xl bg-white shadow">
        <UploadArea />
      </section>

      <section className="p-4 rounded-2xl bg-white shadow space-y-4">
        <SQLStudio onRun={onRun} />
        <div className="flex items-center gap-2">
          <label>Вид: </label>
          <select className="border rounded px-2 py-1" value={viz} onChange={e=>setViz(e.target.value as any)}>
            <option value="table">Таблица</option>
            <option value="line">Линейный график</option>
            <option value="bar">Столбчатый график</option>
          </select>
        </div>
        {viz === 'table' && <DataTable table={table} />}
        {viz !== 'table' && chartData && <ChartView kind={viz==='line'?'line':'bar'} data={chartData} />}
      </section>
    </main>
  );
}
