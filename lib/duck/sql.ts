'use client';
import { getDuck } from './duckClient';
import type { ArrowTable } from '@duckdb/duckdb-wasm';
import { getActiveModel, predictOnTable } from '@/lib/onnx/runtime';

export type PredictPlan = { modelName: string; sql: string; proba?: boolean };
const PREDICT_REGEX = /PREDICT\s+USING\s+(\S+)\s+WITH\s+QUERY\s+([\s\S]+?)(?:\s+RETURN\s+PROBA)?\s*;?$/i;

export function parsePredictDSL(q: string): PredictPlan | null {
  const m = q.trim().match(PREDICT_REGEX);
  if (!m) return null;
  return { modelName: m[1], sql: m[2].trim(), proba: /RETURN\s+PROBA/i.test(q) };
}

export async function runSQL(sql: string): Promise<ArrowTable> {
  const db = await getDuck();
  const conn = await db.connect();
  const res = await conn.query(sql);
  await conn.close();
  return res as unknown as ArrowTable;
}

export async function listTables(): Promise<string[]> {
  const db = await getDuck();
  const conn = await db.connect();
  const res = await conn.query(`PRAGMA show_tables;`);
  const names: string[] = [];
  for (let i = 0; i < res.numRows; i++) {
    const r:any = res.get(i);
    names.push(r.name);
  }
  await conn.close();
  return names;
}

export async function runQueryOrPredict(q: string) {
  const plan = parsePredictDSL(q);
  if (!plan) {
    const data = await runSQL(q);
    return { type: 'sql', data };
  }
  const table = await runSQL(plan.sql);
  const model = getActiveModel(plan.modelName);
  if (!model) throw new Error(`Модель '${plan.modelName}' не найдена.`);
  const merged = await predictOnTable(model, table, plan.proba);
  return { type: 'predict', data: merged };
}
