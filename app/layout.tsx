export const metadata = { title: "WelcomeCSV 2.0", description: "CSV/Logs → SQL → Charts → ONNX" };
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          <header className="py-4">
            <h1 className="text-2xl font-bold">WelcomeCSV 2.0 (Full MVP)</h1>
            <p className="text-sm opacity-75">Загрузка CSV/логов · SQL · ECharts · ONNX</p>
          </header>
          {children}
          <footer className="py-8 text-center text-xs opacity-60">© {new Date().getFullYear()} WelcomeCSV</footer>
        </div>
      </body>
    </html>
  );
}
