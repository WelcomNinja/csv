'use client';
import React, { useEffect, useRef, useState } from 'react';
import { listTables, listColumns } from '@/lib/duck/sql';

export default function SQLStudio({ onRun }: { onRun: (sql: string)=>void }) {
  const [sql, setSql] = useState<string>('PRAGMA show_tables;');
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<Record<string, string[]>>({});
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

  const refreshTables = async () => {
    const t = await listTables();
    setTables(t);
    const cols: Record<string, string[]> = {};
    for (const name of t) {
      try { cols[name] = await listColumns(name); } catch { cols[name] = []; }
    }
    setColumns(cols);
  };

  const insertText = (snippet: string) => {
    if (editorRef.current) {
      const e = editorRef.current;
      const pos = e.getPosition();
      e.executeEdits('insert-sql', [{ range: new monacoRef.current.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: snippet }]);
      e.focus();
    } else {
      setSql(prev => prev + snippet);
    }
  };

  const run = () => onRun(sql);

  return (
    <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:12}}>
      <aside className="card" style={{padding:12}}>
        <div className="subtle" style={{marginBottom:8}}>Схема</div>
        <div className="muted" style={{display:'flex', gap:8, marginBottom:8}}>
          <button className="btn" onClick={refreshTables}>Обновить</button>
          <button className="btn" onClick={()=>insertText('PRAGMA show_tables;\n')}>Показать таблицы</button>
        </div>
        <div style={{maxHeight:300, overflow:'auto'}}>
          {tables.length === 0 && <div className="subtle">Нет таблиц. Загрузите файл.</div>}
          {tables.map(t => (
            <div key={t} style={{marginBottom:8}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <button className="btn" onClick={()=>insertText(`SELECT * FROM ${/[^a-z0-9_]/i.test(t)?`"${t}"`:t} LIMIT 10;\n`)}>{t}</button>
                <button className="btn" onClick={async()=>{ const cols = await listColumns(t); setColumns(prev=>({...prev,[t]:cols})); }}>Колонки</button>
              </div>
              {columns[t]?.length ? (
                <div className="subtle" style={{marginTop:6, paddingLeft:8}}>
                  {columns[t].map(c => (
                    <div key={c} style={{display:'flex', justifyContent:'space-between', gap:8}}>
                      <span>{c}</span>
                      <button className="btn" onClick={()=>insertText(`${/[^a-z0-9_]/i.test(c)?`"${c}"`:c}`)}>вставить</button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </aside>

      <section className="card" style={{padding:12, display:'grid', gap:8}}>
        <div style={{display:'flex', gap:8, alignItems:'center', justifyContent:'space-between'}}>
          <div className="muted">Таблицы: {tables.join(', ') || '—'}</div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn btn-primary" onClick={run}>Выполнить</button>
            <button className="btn" onClick={()=>insertText('SELECT * FROM  LIMIT 10;')}>Шаблон SELECT</button>
            <button className="btn" onClick={()=>insertText('SELECT COUNT(*) FROM ;')}>Шаблон COUNT</button>
          </div>
        </div>
        <div id="sql-editor" style={{height: 260, border: '1px solid #e5e7eb', borderRadius: 8}} />
      </section>
    </div>
  );
}
