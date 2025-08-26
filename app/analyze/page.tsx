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
  const [error, setError] = useState<string | null>(null);

  const onRun = async (sql: string) => {
    setError(null);
    try {
      const res = await runQueryOrPredict(sql);
      setTable(res.data ?? null);
    } catch (e:any) {
      setError(e.message || String(e));
      setTable(null);
    }
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
      <section className="card">
        <div className="flex items-center" style={{justifyContent:'space-between', gap: 12}}>
          <div>
            <div className="h1" style={{fontSize:18}}>Анализ данных</div>
            <div className="subtle">Загрузите файлы и выполните SQL</div>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <UploadArea />
        </div>
      </section>

      <section className="card" style={{display:'grid', gap: 12}}>
        <SQLStudio onRun={onRun} />
        {error && <div className="card" style={{background:'#fff7f7', borderColor:'#fecaca'}}><div className="muted" style={{color:'#b91c1c'}}>Ошибка SQL: {error}</div></div>}
        <div className="flex items-center" style={{gap: 8}}>
          <label className="subtle">Вид</label>
          <select className="select" value={viz} onChange={e=>setViz(e.target.value as any)}>
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
