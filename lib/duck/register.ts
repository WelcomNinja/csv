'use client';
import { getDuck } from './duckClient';
import grok from 'grok-js';

async function ensureGrok() {
  try {
    await grok.loadDefault(async (p:string) => {
      const res = await fetch(`/patterns/${p}`);
      return await res.text();
    });
    return grok;
  } catch (e) {
    console.warn('grok-js not available, falling back to regex');
    return null as any;
  }
}

export async function registerCSV(file: File, name: string) {
  const db = await getDuck();
  const buf = new Uint8Array(await file.arrayBuffer());
  await db.registerFileBuffer(name, buf);
  const conn = await db.connect();
  await conn.query(`CREATE OR REPLACE VIEW ${name} AS SELECT * FROM read_csv_auto('${name}', SAMPLE_SIZE=20000);`);
  await conn.close();
}

export async function registerJSON(file: File, name: string) {
  const db = await getDuck();
  const buf = new Uint8Array(await file.arrayBuffer());
  await db.registerFileBuffer(name + '.json', buf);
  const conn = await db.connect();
  await conn.query(`CREATE OR REPLACE VIEW ${name} AS SELECT * FROM read_json_auto('${name}.json');`);
  await conn.close();
}

export async function registerLog(file: File, name: string, preset: 'nginx_combined'|'apache_combined' = 'nginx_combined') {
  const db = await getDuck();
  const text = await file.text();
  const grokLib = await ensureGrok();
  const rows:any[] = [];
  if (grokLib) {
    const patternName = preset === 'apache_combined' ? '%{COMBINEDAPACHELOG}' : '%{NGINX_ACCESS}';
    try {
      const pattern = grokLib.createPattern(patternName);
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue;
        const parsed = pattern.parseSync(line);
        if (!parsed) continue;
        const obj = parsed.toJSON();
        rows.push({
          timestamp: obj.timestamp || obj.ts || '',
          ip: obj.clientip || obj.remote_addr || obj.ip || '',
          method: obj.request?.split(' ')[0] || obj.verb || '',
          path: obj.request?.split(' ')[1] || obj.request || '',
          status_code: Number(obj.response || obj.status || 0),
          bytes: Number(obj.bytes || obj.body_bytes_sent || 0),
          user_agent: obj.agent || obj['http_user_agent'] || ''
        });
      }
    } catch (e) {
      console.warn('grok parse failed, falling back', e);
    }
  }
  if (rows.length === 0) {
    // fallback simple regex parse for nginx combined / apache combined
    const rx = preset === 'apache_combined'
      ? /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)[^"]*"\s+(\d{3})\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"/
      : /^(\S+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)[^"]*"\s+(\d{3})\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"/;
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(rx);
      if (!m) continue;
      const [_, ip, ts, method, path, status, bytes, ref, agent] = m;
      rows.push({ timestamp: ts, ip, method, path, status_code: Number(status), bytes: bytes === '-' ? 0 : Number(bytes), referrer: ref, user_agent: agent });
    }
  }
  // Build CSV and register
  const header = ['timestamp','ip','method','path','status_code','bytes','user_agent','referrer'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map(h=> JSON.stringify(String(r[h]??'')).replace(/^"|"$/g,'')).join(','));
  }
  const csv = lines.join('\n');
  const buf = new TextEncoder().encode(csv);
  await db.registerFileBuffer(name + '.csv', buf);
  const conn = await db.connect();
  await conn.query(`CREATE OR REPLACE VIEW ${name} AS SELECT * FROM read_csv_auto('${name}.csv');`);
  await conn.close();
}
