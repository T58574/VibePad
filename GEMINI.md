# GEMINI.md - VibePad Technical Blueprint & Session Memory

> **System Memory**: Этот документ содержит полное описание архитектуры, требований, решений и актуального состояния проекта **VibePad**. Используется для сохранения контекста между сессиями Antigravity AI.

---

## 🚀 Overview & Vision

**VibePad** — это сверхбыстрый, легкий текстовый редактор в стиле Sublime Text / Linear для работы с любыми текстовыми форматами (`.log`, `.json`, `.yaml`, `.md`, `.env`, `.sql`, `.py`, `.js`, `.ts`, `.tsx` и др.). 
Главное отличие — запуск как **автономный бинарник `VibePad.exe`** на базе нативного **Electron Host**, исключающего любые проблемы с внешними зависимостями (WebView2 Runtime, WebSocket порт-токенами и `.neu` архивами).

---

## 🛠️ Technical Stack & Architecture

- **Core Editor Engine**: CodeMirror 6 (виртуализированный скроллинг для гигантских логов, мультикурсоры, подсветка синтаксиса JS/TS/SQL/Python/YAML/JSON/Markdown, line wrapping).
- **UI Framework**: React 18 + Vite + Tailwind CSS (Glassmorphism dark theme в стиле Sublime / Linear).
- **Automated Testing Suite**: Vitest + JSDOM (`npm run test`), 43/43 проходящих автотестов для утилит и SaaS функционала.
- **Resilience Layer**: React `ErrorBoundary` для перехвата рантайм-ошибок с дашбордом аварийного восстановления сессий без потери файлов.
- **Markdown Engine**: `markdown-it` (с безопасной ленивой инициализацией) + `highlight.js` + `katex` (переключение по `Ctrl+E`).
- **Native Host & Launcher**: Standalone Electron Runtime packaged via `electron-builder` into single **`VibePad.exe`**.
- **Performance & Code Splitting**: Rollup `manualChunks` стратегия для Vite с разделением тяжелых библиотек (`codemirror-vendor`, `markdown-vendor`, `react-vendor`) и ультрабыстрым стартом.
- **Hybrid System Bridge (`ipcBridge.ts`)**: 
  - Нативный асинхронный Electron IPC Bridge (`contextBridge` + `ipcRenderer` / `ipcMain`).
  - Экранирование CLI параметров (`escapeShellArg()`) для защиты от Shell Injection при вызове Antigravity AI (`agy`).
- **Atomic File I/O & Stream Guard**:
  - Асинхронный non-blocking I/O (`fs.promises`).
  - Запись во временные файлы `.vibetmp` с последующим `rename` (атомарное сохранение против повреждения файлов при сбоях).
- **SaaS Features & DevTools Suite (`saasFeatures.ts` & `devTools.ts`)**:
  - **Vibe Productivity & Telemetry Dashboard (`Ctrl+Shift+S`)**: Метрики в реальном времени, RAM footprint, Vibe Index Score, статистика языков/строк и встроенная оценка сложности кода (Cyclomatic Complexity & Maintainability Index).
  - **SaaS Snippet Vault & Custom Templates (`Ctrl+Shift+V`)**: Встроенный каталог шаблонов (Docker Compose, Kubernetes Manifest, Nginx, Postgres, OpenAPI, Vite React, FastAPI Python) + форма создания и локального сохранения собственных сниппетов.
  - **Developer Tools**: Генератор TypeScript интерфейсов из JSON, JSON <-> YAML конвертер, JWT Генератор/Декодер, SHA-256 Хэш вычисления, Regex парсер с позиционированием, SQL Форматтер & Минификатор, конвертер cURL в `fetch()`, Unicode Base64, CSV -> Markdown Таблицы, URL/HTML Encode & Decode.
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
├── vitest.config.ts                  # Конфигурация тестовой среды Vitest
├── package.json                      # Конфигурация зависимостей, npm и electron-builder скриптов
├── vite.config.ts                    # Конфиг сборщика Vite с manualChunks расщеплением бандла
├── tailwind.config.js                # Стили и Glassmorphism токены
├── electron/
│   ├── main.cjs                      # Electron Main Process (IPC, File I/O, Shell execution)
│   └── preload.cjs                   # Safe Context Bridge для IPCBridge
├── scripts/
│   ├── register-windows.js           # Регистрация контекстного меню Windows Explorer & генерация .reg
│   └── build-exe.js                  # Сборка автономного бинарника VibePad.exe через electron-builder
├── public/
│   └── vibe-icon.svg                 # Иконка VibePad
└── src/
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
        ├── ipcBridge.ts              # Гибридный IPC мост (Electron IPC + HTTP Server + Shell Escape)
        ├── ipcBridge.test.ts         # Автотесты IPC моста и защиты CLI
        ├── encodings.ts              # Детекция BOM, UTF-8 и Win-1251
        ├── encodings.test.ts         # Автотесты конвертации кодировок и символов переноса
        ├── devTools.ts               # Safe Unicode Base64, JSON<->YAML, JWT Gen/Dec, SHA-256, Code Complexity, TS Gen
        ├── devTools.test.ts          # Автотесты DevTools трансформеров (23/23 tests)
        ├── saasFeatures.ts           # SaaS модуль экспорта сессий, метрик и пользовательских шаблонов
        └── saasFeatures.test.ts      # Автотесты SaaS модуля (7/7 tests)
```

---

## 🛠️ Build & Run Commands

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск в режиме разработки (Vite)
npm run dev

# 3. Запуск десктопного приложения Electron
npm run electron

# 4. Запуск suite автотестов (Vitest, 43/43 tests)
npm run test

# 5. Сборка автономного исполняемого файла VibePad.exe
npm run build:exe

# 6. Интеграция в контекстное меню Windows Explorer
npm run register
```
