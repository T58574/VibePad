# GEMINI.md - VibePad Technical Blueprint & Session Memory

> **System Memory**: Этот документ содержит полное описание архитектуры, требований, решений и актуального состояния проекта **VibePad**. Используется для сохранения контекста между сессиями Antigravity AI.

> [!CAUTION]
> **ПРОЕКТ ЗАКРЫТ И ПЕРЕВЕДЕН В АРХИВ**: GEMINI не смогла сделать данный проект полноценно работающим текстовым редактором под Windows.

---

## 🚀 Overview & Vision

**VibePad** — это сверхбыстрый, легкий текстовый редактор в стиле Sublime Text / Linear для работы с любыми текстовыми форматами (`.log`, `.json`, `.yaml`, `.md`, `.env`, `.sql`, `.py`, `.js`, `.ts`, `.tsx` и др.). 
Приложение работает на базе ультралегкого **Electrobun (Bun Main Process + System WebView2)**, гарантирующего холодный запуск `<60ms`, потребление оперативки `~30MB RAM` и компактный бинарный пакет `~12MB`.

---

## 🛑 Strict Anti-Regression & Execution Rules for AI

> **ПРАВИЛА ОДНОПРОХОДНОГО ВЫПОЛНЕНИЯ (SINGLE-PASS EXECUTION)**:
> 1. **Валидация в реальной ОС вместо синтетических тестов**: Успех задачи фиксируется ТОЛЬКО после сборки реального бинарника (`npm run build:exe`), полной очистки старых артефактов и проверки реальных системных вызовов (CLI аргументы, реестр Windows Explorer, drag-and-drop).
> 2. **Атомарный цикл сборки**: Любое изменение в нативном процессе или IPC мосте ТРЕБУЕТ очистки `dist/` и `release/`, полной пересборки бинарника и автоматической перерегистрации в реестре Windows в рамках ОДНОГО ответа.
> 3. **Асинхронные RPC контракты без гонок**: Все нативные вызовы на старте UI (получение начального файла CLI) должны содержать retry-цикл (8 попыток x 150ms) для компенсации времени инициализации WebSocket RPC канала в десктопном WebView.
> 4. **Ноль фальшивых отчетов**: Никаких "тесты прошли = всё работает". Проверяется только фактический рантайм ОС.

---

## 🛠️ Technical Stack & Architecture

- **Core Editor Engine**: CodeMirror 6 (виртуализированный скроллинг для гигантских логов, мультикурсоры, подсветка синтаксиса JS/TS/SQL/Python/YAML/JSON/Markdown, line wrapping).
- **UI Framework**: React 18 + Vite + Tailwind CSS (Glassmorphism dark theme в стиле Sublime / Linear).
- **Resilience Layer**: React `ErrorBoundary` для перехвата рантайм-ошибок с дашбордом аварийного восстановления сессий без потери файлов.
- **Markdown Engine**: `markdown-it` (с безопасной ленивой инициализацией) + `highlight.js` + `katex` (переключение по `Ctrl+E`).
- **Native Host & Runtime**: **Electrobun** (Bun TypeScript Main Process + System WebView2) packaged into single standalone executable.
- **Performance & Code Splitting**: Rollup `manualChunks` стратегия для Vite с разделением тяжелых библиотек (`codemirror-vendor`, `markdown-vendor`, `react-vendor`) и ультрабыстрым стартом.
- **Hybrid System Bridge (`ipcBridge.ts`)**: 
  - Нативный Electrobun RPC Bridge (`BrowserView.defineRPC` / `Electroview.defineRPC`) со строгой типизацией (`AppRPC`).
  - Экранирование CLI параметров (`escapeShellArg()`) для защиты от Shell Injection при вызове Antigravity AI (`agy`).
- **Atomic File I/O & Stream Guard**:
  - Асинхронный non-blocking I/O (`fs.promises` / `Bun.file`).
  - Запись во временные файлы `.vibetmp` с последующим `rename` (атомарное сохранение против повреждения файлов при сбоях).
- **SaaS Features & DevTools Suite (`saasFeatures.ts` & `devTools.ts`)**:
  - **SAST Static Code Security & Secret Scanner (`analyzeCodeSecurity`)**: Сканирование на утечки AWS/GitHub/Stripe/OpenAI ключей, SSH приватных ключей, RCE eval(), XSS innerHTML, SQL-инъекций и небезопасных TLS настроек с генерацией скоринга безопасности.
  - **Vibe Productivity & Telemetry Dashboard (`Ctrl+Shift+S`)**: Метрики в реальном времени, RAM footprint, Vibe Index Score, статистика языков/строк, оценка сложности кода (Cyclomatic Complexity & Maintainability Index) и интерактивный SAST аудитор безопасности.
  - **SaaS Snippet Vault & Workspace Presets (`Ctrl+Shift+V`)**: Встроенный каталог шаблонов + 1-click генератор готовых окружений (Fullstack Node, Python FastAPI, DevOps K8s) + пользовательские сниппеты.
  - **Developer Tools Suite**: Line-by-line Diff (`diffText`), JSON Dot-notation Flatten/Unflatten, RFC 4122 v4 UUID генератор, Конвертер цветов (HEX <-> RGB <-> HSL), Timestamp & ISO 8601 Конвертер, Cron выражение в понятную речь (`humanizeCron`), форматирование Markdown таблиц (`formatMarkdownTable`), сортировка `.env` файлов (`formatEnvFile`), анализатор производительности (`analyzeFilePerformance`), генерация TS типов, JSON<->YAML, JWT, SHA-256, SQL Форматтер, cURL->fetch.
  - **Cloud Sync & Session Transfer (`Ctrl+Shift+E` / Header)**: 1-click экспорт/импорт всей сессии в JSON и генерация GitHub Gist Share payload.
- **Windows Explorer Integration**: Регистрация в реестре Windows (`HKCU\Software\Classes`):
  - Контекстное меню для любых файлов: **"Открыть в VibePad"** с иконкой приложения.
  - Регистрация в системном диалоге **"Открыть с помощью..."** (Open With).

---

## 🔥 Key Features & Edge Cases

1. **Large File Handling (>50MB)**: Авто-переход в Safe Performance Mode (отключение тяжелых синтаксических парсеров для предотвращения зависания UI).
2. **Encodings & Line Endings**: Авто-детекция `UTF-8`, `UTF-8 BOM`, `UTF-16`, `Windows-1251 (ANSI)` (с проверкой валидности многобайтовых последовательностей) + переключатель `CRLF`/`LF`.
3. **Unicode Base64 & Advanced DevTools**: Нативный Unicode Base64 кодер (`TextEncoder`/`TextDecoder`), JSON<->YAML, SHA-256, генератор TS-типов из JSON, SQL форматирование, cURL в fetch, JWT генератор & парсер.
4. **Sublime Multi-Cursor & Search**: `Ctrl+D` (выделение совпадений), `Alt+Click` (мультикурсоры), Regex Search & Replace (`Ctrl+F` / `Ctrl+H`).
5. **Live Log Tail & Smart Filter (`Ctrl+Shift+F`)**:
   - Слежение за авто-обновлением лог-файлов в реальном времени.
   - Мгновенный memoized фильтр строк по ключам (`[ERROR]`, `[WARN]`, `[INFO]`).
6. **Split-View File Diff (`Ctrl+Shift+D`)**: 2-панельное сравнение файлов или выделенного текста.
7. **Smart Context Floating Bar**: Авто-детекция выделенного текста (Unix Timestamp -> дата, JSON -> TS Interface / YAML, SHA-256 -> Hash, SQL -> Format, Base64 -> расшифровка, `Ctrl+K` -> AI).
8. **Hot-Exit & QuotaExceeded Safe Session**: Автосохранение открытых вкладок и неименованных черновиков (`Untitled-1`). Защита `localStorage` от переполнения квоты при больших файлах.
9. **Quick Shell Runner (`Alt+X`)**: Выполнение выделенного кода/скрипта с выводом в консольную панель.
10. **Antigravity AI Sidecar (`Ctrl+K`)**: Всплывающий AI-промпт с интерактивным Diff-превью и кнопкой "Apply Diff".

---

## 📁 Project Structure

```
vibe-pad/
├── GEMINI.md                         # Документ памяти сессий и архитектуры
├── electrobun.config.ts              # Конфигурация приложения и сборки Electrobun
├── package.json                      # Зависимости и npm-скрипты
├── vite.config.ts                    # Конфиг сборщика Vite с manualChunks расщеплением бандла
├── tailwind.config.js                # Стили и Glassmorphism токены
├── scripts/
│   ├── register-windows.js           # Регистрация контекстного меню Windows Explorer & генерация .reg
│   └── build-exe.js                  # Сборка нативного бинарника VibePad.exe через Electrobun
├── public/
│   └── vibe-icon.svg                 # Иконка VibePad
└── src/
    ├── main/
    │   └── index.ts                  # Electrobun Bun Main Process (RPC Handlers: I/O, Shell, AI pipe)
    ├── shared/
    │   └── rpc.ts                    # Type-safe RPC schema contract (AppRPC)
    ├── main.tsx                      # Точка входа React с ErrorBoundary
    ├── App.tsx                       # Главный макет, вкладки с UUID, Hot-Exit сессия, Toast-уведомления
    ├── index.css                     # Tailwind & Glassmorphic стили
    ├── components/
    │   ├── ErrorBoundary.tsx         # Перехватчик рантайм-ошибок и восстановление
    │   ├── Editor.tsx                # CodeMirror 6 wrapper с оптимизированным updateListener & syntax highlight
    │   ├── MarkdownViewer.tsx        # HTML рендерер для Markdown (Ctrl+E)
    │   ├── DiffViewer.tsx            # Side-by-Side 2-панельный дифф
    │   ├── AntigravityPrompt.tsx     # Floating AI Sidebar с обработкой ошибок
    │   ├── CommandPalette.tsx        # Fuzzy finder (Ctrl+P) с клавиатурной навигацией
    │   ├── QuickContextBar.tsx       # Всплывающая плашка на выделение (Timestamp/Base64/JSON->TS/YAML/SHA256/SQL)
    │   ├── LogFilterBar.tsx          # Live Log Tail & Smart Filter
    │   ├── SaaSProductivityModal.tsx # Vibe Productivity & Telemetry Dashboard (Ctrl+Shift+S) + Code Complexity
    │   ├── SaaSSnippetVaultModal.tsx # SaaS Templates & Snippets Vault (Ctrl+Shift+V)
    │   └── SaaSSessionExportModal.tsx# Cloud Sync & Session Export/Import (Ctrl+Shift+E)
    └── utils/
        ├── ipcBridge.ts              # Гибридный Electrobun RPC + Fallback IPC мост
        ├── encodings.ts              # Детекция BOM, UTF-8 и Win-1251
        ├── devTools.ts               # Safe Unicode Base64, JSON<->YAML, JWT Gen/Dec, SHA-256, Code Complexity, TS Gen
        └── saasFeatures.ts           # SaaS модуль экспорта сессий, метрик и пользовательских шаблонов
```

---

## 🛠️ Build & Run Commands

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск в режиме разработки (Vite)
npm run dev

# 3. Запуск десктопного приложения Electrobun
npm run electrobun

# 4. Сборка автономного исполняемого файла VibePad через Electrobun
npm run build:exe

# 5. Интеграция в контекстное меню Windows Explorer
npm run register
```
