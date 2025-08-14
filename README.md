# WelcomeCSV 2.0 — Full MVP

Этот репозиторий — расширенная версия MVP: Monaco SQL editor, Grok parsing (grok-js), DuckDB-Wasm и ONNX inference.

## Запуск
```bash
npm i
npm run dev
```

## Особенности
- Для корректной работы WASM pthread могут потребоваться COOP/COEP заголовки (уже в next.config.mjs)
- Monaco editor грузится динамически
- Grok шаблоны можно добавить в public/patterns
