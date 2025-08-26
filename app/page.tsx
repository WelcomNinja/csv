import Link from 'next/link';

export default function Home() {
  return (
    <main className="space-y-6">
      <section className="card">
        <div className="h1">Добро пожаловать в WelcomeCSV</div>
        <p className="muted">Загрузите CSV/логи/JSON и выполняйте SQL прямо в браузере.</p>
        <div style={{marginTop:12}}>
          <Link href="/analyze" className="btn btn-primary">Перейти в анализ</Link>
        </div>
      </section>
    </main>
  );
}
