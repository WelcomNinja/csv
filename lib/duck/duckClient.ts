'use client';
import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

export async function getDuck(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;
  const bundles = duckdb.getJsDelivrBundles();
  // Worker import
  const workerURL = new URL('@duckdb/duckdb-wasm/dist/duckdb-browser.worker.js', import.meta.url);
  const worker = new Worker(workerURL);
  const logger = new duckdb.ConsoleLogger();
  const dbInst = new duckdb.AsyncDuckDB(logger, worker);
  await dbInst.instantiate(bundles.main, bundles.pthread);
  db = dbInst;
  return dbInst;
}
