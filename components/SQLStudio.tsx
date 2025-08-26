'use client';
import React, { useEffect, useRef, useState } from 'react';
import { listTables } from '@/lib/duck/sql';

export default function SQLStudio({ onRun }: { onRun: (sql: string)=>void }) {
  const [sql, setSql] = useState<string>('PRAGMA show_tables;');
  const [tables, setTables] = useState<string[]>([]);
  const [showHints, setShowHints] = useState<boolean>(true);
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

  const insertSQL = (snippet: string) => {
    if (editorRef.current) {
      const e = editorRef.current;
      const pos = e.getPosition();
      e.executeEdits('insert-sql', [{ range: new monacoRef.current.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: snippet + '\n' }]);
      e.focus();
    } else {
      setSql(prev => prev ? prev + '\n' + snippet : snippet);
    }
  };

  const firstTable = tables[0];
  const hintItems: { label: string; sql: string }[] = [
    { label: 'Показать таблицы', sql: 'PRAGMA show_tables;' },
    firstTable ? { label: 'Первые 10 строк', sql: `SELECT * FROM ${firstTable} LIMIT 10;` } : null,
    firstTable ? { label: 'Подсчёт строк', sql: `SELECT COUNT(*) AS cnt FROM ${firstTable};` } : null,
    firstTable ? { label: 'Топ значений колонки', sql: `-- замените column_name на нужную колонку\nSELECT column_name, COUNT(*) AS cnt\nFROM ${firstTable}\nGROUP BY 1\nORDER BY cnt DESC\nLIMIT 20;` } : null,
    { label: 'ONNX PREDICT', sql: 'PREDICT USING mymodel WITH QUERY SELECT * FROM mytable LIMIT 100;' }
  ].filter(Boolean) as any;

  return (
    <div className="space-y-2">
      <div className="subtle">Таблицы: {tables.join(', ') || '—'}</div>

      {showHints && (
        <div className="muted" style={{display:'flex', flexWrap:'wrap', gap: 8}}>
          {hintItems.map((h, idx)=> (
            <button key={idx} className="btn" onClick={()=>insertSQL(h.sql)}>{h.label}</button>
          ))}
          <button className="btn" onClick={()=>setShowHints(false)}>Скрыть подсказки</button>
        </div>
      )}
      {!showHints && (
        <div>
          <button className="btn" onClick={()=>setShowHints(true)}>Показать подсказки</button>
        </div>
      )}

      <div id="sql-editor" style={{height: 220, border: '1px solid #e5e7eb', borderRadius: 8}} />
      <div style={{display:'flex', gap:8}}>
        <button onClick={()=>onRun(sql)} className="btn btn-primary">Выполнить</button>
        <button onClick={async()=>setTables(await listTables())} className="btn">Обновить таблицы</button>
      </div>
    </div>
  );
}
