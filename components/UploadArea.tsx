'use client';
import React, { useCallback, useRef, useState } from 'react';
import { registerCSV, registerLog, registerJSON } from '@/lib/duck/register';
import { loadModel } from '@/lib/onnx/runtime';

export default function UploadArea() {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Файлы не загружены');

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const name = file.name.replace(/[^a-zA-Z0-9_\.]/g, '_');
      if (file.size > 2 * 1024 * 1024 * 1024) {
        setStatus(`Файл ${file.name} больше 2 ГБ — пропущен.`);
        continue;
      }
      try {
        if (/\.csv$/i.test(file.name) || /\.tsv$/i.test(file.name)) {
          await registerCSV(file, name.replace(/\.(csv|tsv)$/i,'').toLowerCase());
          setStatus(`CSV/TSV зарегистрирован: ${file.name}`);
        } else if (/\.log$/i.test(file.name)) {
          await registerLog(file, name.replace(/\.log$/i, '').toLowerCase(), 'nginx_combined');
          setStatus(`Лог зарегистрирован: ${file.name}`);
        } else if (/\.json$/i.test(file.name)) {
          await registerJSON(file, name.replace(/\.json$/i, '').toLowerCase());
          setStatus(`JSON зарегистрирован: ${file.name}`);
        } else if (/\.onnx$/i.test(file.name)) {
          await loadModel(file, name.replace(/\.onnx$/i, ''));
          setStatus(`ONNX модель загружена: ${file.name}`);
        } else {
          setStatus(`Формат не поддерживается: ${file.name}`);
        }
      } catch (e:any) {
        console.error(e);
        setStatus(`Ошибка: ${e.message || e.toString()}`);
      }
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  return (
    <div
      ref={ref}
      onDragOver={e=>e.preventDefault()}
      onDrop={onDrop}
      className="border rounded-2xl p-4"
      style={{borderStyle: 'dashed'}}
    >
      <p className="text-sm">Перетащите сюда файлы: <b>.csv</b>, <b>.tsv</b>, <b>.log</b>, <b>.json</b>, <b>.onnx</b>. Максимум 2 ГБ.</p>
      <input type="file" multiple onChange={e=>onFiles(e.target.files)} className="mt-2" />
      <p className="text-sm opacity-75 mt-2">{status}</p>
    </div>
  );
}
