# WelcomeCSV 2.0

Инструмент для быстрой аналитики данных прямо в браузере: загрузите CSV/логи/JSON, выполните SQL-запросы локально (DuckDB-WASM), визуализируйте данные (ECharts) и делайте предсказания ONNX-моделями — без бэкенда и без передачи данных на сервер.

## Возможности
- Загрузка файлов: **.csv**, **.tsv**, **.log** (nginx/apache), **.json**, **.onnx** (модель)
- Автоматическая регистрация файлов как `VIEW` в DuckDB (read_csv_auto/read_json_auto)
- Парсинг логов с помощью `grok-js` (с фолбэком на RegExp)
- SQL-студия на базе Monaco Editor: выполнение запросов в браузере
- Простая DSL для инференса моделей ONNX:
  - `PREDICT USING <model_name> WITH QUERY <SQL> [RETURN PROBA];`
- Табличный вывод результатов (до 500 строк) и графики (`line`, `bar`) через ECharts
- Полностью локально: данные не покидают ваш браузер

## Технологии
- Next.js 14 (App Router), React 18
- DuckDB-WASM (`@duckdb/duckdb-wasm`)
- ONNX Runtime Web (`onnxruntime-web`)
- ECharts (`echarts`)
- Monaco Editor (`monaco-editor`)
- Grok patterns (`grok-js`) для логов
- TypeScript, ESLint

## Быстрый старт (локально)
1. Установите зависимости и запустите dev-сервер:
```bash
npm install
npm run dev
```
Откройте: http://localhost:3000

2. Продакшен-сборка:
```bash
npm run build
npm run start
```

## Quick Start через degit 
```bash
npx --yes degit <your-github-user>/WelcomeCSV welcome-csv
cd welcome-csv
npm install
npm run dev
# прод:
# npm run build && npm run start
```

## Quick Start через Docker
1. Сборка образа:
```bash
docker build -t welcome-csv .
```
2. Запуск:
```bash
docker run --rm -p 3000:3000 welcome-csv
```
Затем откройте http://localhost:3000

## Страницы
- `/` — приветственная страница и переход в анализ
- `/analyze` — основная студия: загрузка, SQL, таблица/графики
- `/api/health` — простая проверка доступности (`{"ok": true}`)

## Как это работает
- `lib/duck/duckClient.ts` — инициализация DuckDB-WASM и worker, lazy singleton (fallback без threads при отсутствии COOP/COEP)
- `lib/duck/register.ts` — регистрация CSV/JSON/LOG во внутренней FS DuckDB и создание `VIEW`
- `lib/duck/sql.ts` — `runSQL`, `listTables`, `listColumns`, DSL-парсер `PREDICT` и объединение результатов
- `lib/onnx/runtime.ts` — загрузка моделей ONNX и инференс по данным Arrow Table
- Компоненты:
  - `components/UploadArea.tsx` — drag&drop/ввод файлов, статус
  - `components/SQLStudio.tsx` — редактор + сайдбар схемы (таблицы/колонки), тулбар
  - `components/DataTable.tsx` — рендер результата SQL (до 500 строк)
  - `components/ChartView.tsx` — `line`/`bar` графики

## Инструкция по использованию
1. Перейдите на `/analyze`.
2. Перетащите файлы в область загрузки:
   - CSV/TSV → появится `VIEW` c именем файла (без расширения)
   - LOG (nginx/apache) → будет спарсено в структуру (timestamp, ip, method, path, status_code, bytes, user_agent, referrer)
   - JSON → таблица из JSON
   - ONNX → загрузится модель с именем файла
3. Выполните SQL-запрос. Примеры:
```sql
PRAGMA show_tables;
SELECT * FROM your_table LIMIT 10;
SELECT COUNT(*) FROM your_table;
```
4. Выберите вид отображения: Таблица / Линейный график / Столбчатый график.

## ONNX-инференс (DSL)
```sql
PREDICT USING mymodel WITH QUERY SELECT * FROM mytable;
-- или вероятности
PREDICT USING mymodel WITH QUERY SELECT * FROM mytable RETURN PROBA;
```

## Ограничения и заметки
- Файлы до ~2 ГБ (проверка на клиенте в `UploadArea`)
- В таблице отображаются первые 500 строк для производительности
- Парсинг логов: сначала `grok-js` и бандл паттернов из `public/patterns/`, при ошибке — fallback RegExp
- Визуализация: возьмутся первые два столбца как X/Y для простоты
- Все вычисления выполняются в браузере; производительность зависит от устройства

## Скрипты
- `npm run dev` — запуск dev-сервера Next.js
- `npm run build` — сборка
- `npm run start` — старт production-сборки
- `npm run lint` — линтинг

## Лицензия
MIT (если требуется, обновите секцию по вашим условиям)
