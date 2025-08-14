'use client';
import React, { useEffect, useRef, useState } from 'react';
import { listTables, runQueryOrPredict } from '@/lib/duck/sql';

export default function SQLStudio({ onRun }: { onRun: (sql: string)=>void }) {
  const [sql, setSql] = useState<string>('SELECT 1 as x, 2 as y;');
  const [tables, setTables] = useState<string[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => { (async () => setTables(await listTables()))(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const monaco = await import('monaco-editor');
      monacoRef.current = monaco;
      if (cancelled) return;
      editorRef.current = monaco.editor.create(document.getElementById('sql-editor')!, {
        value: sql,
        language: 'sql',
        automaticLayout: true,
        minimap: { enabled: false },
      });
      editorRef.current.onDidChangeModelContent(()=> setSql(editorRef.current.getValue()));
    })();
    return ()=> { cancelled = true; if (editorRef.current) editorRef.current.dispose(); };
  }, []);

  const run = async () => {
    try {
      const res = await runQueryOrPredict(sql);
      onRun(sql);
    } catch (e:any) {
      alert(e.message || String(e));
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm opacity-75">Таблицы: {tables.join(', ') || '—'}</div>
      <div id="sql-editor" style={{height: 240, border: '1px solid #e5e7eb', borderRadius: 8}} />
      <div className="flex gap-2">
        <button onClick={run} className="px-3 py-1 border rounded">Выполнить</button>
        <button onClick={async()=>setTables(await listTables())} className="px-3 py-1 border rounded">Обновить таблицы</button>
      </div>
    </div>
  );
}
