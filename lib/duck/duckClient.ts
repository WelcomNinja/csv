'use client';
import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

function hasThreads(): boolean {
  // Basic feature-detect for Web Workers with SharedArrayBuffer
  // Threads require cross-origin isolation; fallback path avoids pthread
  return typeof SharedArrayBuffer !== 'undefined';
}

async function instantiateWithTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('DuckDB init timeout')), ms))
  ]);
}

async function instantiateFromUrls(mainWorkerUrl: string, mainModuleUrl: string, pthreadUrl?: string, timeoutMs = 8000) {
  // Same-origin bootstrap to avoid cross-origin Worker restrictions
  const bootstrap = `importScripts('${mainWorkerUrl}');`;
  const blob = new Blob([bootstrap], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const worker = new Worker(blobUrl);
    const logger = new duckdb.ConsoleLogger();
    const dbInst = new duckdb.AsyncDuckDB(logger, worker);
    await instantiateWithTimeout(dbInst.instantiate(mainModuleUrl, pthreadUrl), timeoutMs);
    return dbInst;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function getDuck(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const wantThreads = hasThreads();

  // Try EH (threads) if available, else go straight to non-EH
  const attempts: Array<() => Promise<duckdb.AsyncDuckDB>> = [];
  if (wantThreads) {
    attempts.push(() => instantiateFromUrls(bundle.mainWorker, bundle.mainModule, bundle.pthreadWorker));
  }
  attempts.push(() => {
    const fallbackWorker = bundle.mainWorker.replace('-eh.worker.js', '.worker.js');
    const fallbackModule = bundle.mainModule.replace('-eh.wasm', '.wasm');
    return instantiateFromUrls(fallbackWorker, fallbackModule);
  });

  const errors: any[] = [];
  for (const attempt of attempts) {
    try {
      db = await attempt();
      return db;
    } catch (e) {
      errors.push(e);
    }
  }
  console.error('DuckDB-WASM init failed:', ...errors);
  throw errors[errors.length - 1] || new Error('DuckDB init failed');
}
