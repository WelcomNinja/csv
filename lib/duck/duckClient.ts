'use client';
import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

export async function getDuck(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  // Create a same-origin blob worker that bootstraps the CDN worker via importScripts
  const bootstrap = `importScripts('${bundle.mainWorker}');`;
  const blob = new Blob([bootstrap], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  const logger = new duckdb.ConsoleLogger();
  const dbInst = new duckdb.AsyncDuckDB(logger, worker);
  await dbInst.instantiate(bundle.mainModule, bundle.pthreadWorker);
  db = dbInst;
  return dbInst;
}
