import Link from 'next/link';

export default function Home() {
  return (
    <main className="space-y-6">
      <section className="p-4 rounded-2xl bg-white shadow">
        <h2 className="text-lg font-semibold">Добро пожаловать в WelcomeCSV</h2>
        <p className="text-sm opacity-75">Инструмент для загрузки CSV/логов, выполнения SQL в браузере и ONNX-прогнозирования.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/analyze"><a className="px-4 py-2 border rounded bg-slate-100">Перейти в анализ</a></Link>
        </div>
      </section>
    </main>
  );
}
