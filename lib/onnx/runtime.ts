'use client';
import * as ort from 'onnxruntime-web';
import type { ArrowTable } from '@duckdb/duckdb-wasm';

type ONNXModel = { name: string; session: ort.InferenceSession; input: string; output: string };
const models = new Map<string, ONNXModel>();

export async function loadModel(file: File, name: string) {
  const buf = await file.arrayBuffer();
  const session = await ort.InferenceSession.create(buf, { executionProviders: ['wasm', 'webgl'] });
  const input = session.inputNames[0];
  const output = session.outputNames[0];
  const model = { name, session, input, output };
  models.set(name, model);
  return model;
}

export function getActiveModel(name: string) {
  return models.get(name);
}

function arrowToFeeds(table: ArrowTable, inputName: string): Record<string, ort.Tensor> {
  const cols = table.schema.fields.map((f:any)=>f.name);
  const numeric = cols.filter(c => typeof table.get(0)?.[c] === 'number');
  const rows = table.numRows;
  const features = numeric.length ? numeric : [cols[0]];
  const data = new Float32Array(rows * features.length);
  for (let i=0;i<rows;i++) {
    const row:any = table.get(i);
    for (let j=0;j<features.length;j++) {
      const v = row[features[j]];
      data[i*features.length + j] = typeof v === 'number' ? v : 0;
    }
  }
  const tensor = new ort.Tensor('float32', data, [rows, features.length]);
  return { [inputName]: tensor };
}

export async function predictOnTable(model: ONNXModel, table: ArrowTable, proba?: boolean): Promise<ArrowTable> {
  const feeds = arrowToFeeds(table, model.input);
  const out = await model.session.run(feeds);
  const t = out[model.output] as ort.Tensor;
  const preds: number[] = Array.from(t.data as Float32Array);

  // Attach predictions by creating a temporary CSV and joining via DuckDB
  const { getDuck } = await import('@/lib/duck/duckClient');
  const db = await getDuck();
  const conn = await db.connect();
  const tmpName = `tmp_src_${Math.random().toString(36).slice(2,8)}`;
  // Write original table into a temp view by exporting to csv via DuckDB's query result string
  // Simple approach: build CSV of predictions and join on row_number()
  const predLines = ['_row_id,prediction'];
  for (let i=0;i<preds.length;i++) predLines.push(`${i},${preds[i]}`);
  const predCsv = predLines.join('\n');
  const predFile = `${tmpName}_pred.csv`;
  await db.registerFileBuffer(predFile, new TextEncoder().encode(predCsv));
  // Create a view for original table with row numbers
  await conn.query(`CREATE OR REPLACE VIEW ${tmpName} AS SELECT ROW_NUMBER() OVER () - 1 as _row_id, * FROM (${table.toString()});`);
  const res = await conn.query(`SELECT a.*, b.prediction FROM ${tmpName} a JOIN read_csv_auto('${predFile}') b USING(_row_id);`);
  await conn.close();
  return res as unknown as ArrowTable;
}
