# GEMINI.md - VibePad Technical Blueprint & Session Memory

> **System Memory**: Этот документ содержит полное описание архитектуры, требований, решений и актуального состояния проекта **VibePad**. Используется для сохранения контекста между сессиями Antigravity AI.

---

## 🚀 Overview & Vision

**VibePad** — это сверхбыстрый, легкий текстовый редактор в стиле Sublime Text / Linear для работы с любыми текстовыми форматами (`.log`, `.json`, `.yaml`, `.md`, `.env`, `.sql`, `.py`, `.js`, `.ts` и др.). 
Главное отличие от монструозных IDE — отсутствие оверхеда Rust/Tauri/Chromium и запуск как **автономный бинарник `VibePad.exe`** с потреблением памяти в районе **30-50MB RAM**.

---

## 🛠️ Technical Stack & Architecture

- **Core Editor Engine**: CodeMirror 6 (виртуализированный скроллинг для гигантских логов, мультикурсоры, подсветка синтаксиса).
- **UI Framework**: React 18 + Vite + Tailwind CSS (Glassmorphism dark theme в стиле Sublime / Linear).
- **Resilience Layer**: React `ErrorBoundary` для перехвата рантайм-ошибок с дашбордом аварийного восстановления сессий без потери файлов.
- **Markdown Engine**: `markdown-it` + `highlight.js` + `katex` (переключение по `Ctrl+E`).
- **Native Host & Launcher**: Edge WebView2 host packaged via Neutralino.js / Node SEA into **`VibePad.exe`**.
- **Hybrid System Bridge (`ipcBridge.ts`)**: 
  - Автоматическое переключение между Neutralino Native API и Node HTTP Server Bridge (`http://localhost:3456`).
  - Экранирование CLI параметров (`escapeShellArg()`) для защиты от Shell Injection при вызове Antigravity AI (`agy`).
- **Atomic File I/O & Stream Guard**:
  - Асинхронный non-blocking I/O (`fs.promises`).
  - Запись во временные файлы `.vibetmp` с последующим `rename` (атомарное сохранение против повреждения файлов при сбоях).
  - Лимит 50MB Body Guard Limit с отдачей `413 Payload Too Large`.
  - Автоподбор порта при конфликтах `EADDRINUSE`.
- **Windows Explorer Integration**: Регистрация в реестре Windows (`HKCU\Software\Classes`):
  - Контекстное меню для любых файлов: **"Открыть в VibePad"** с иконкой приложения.
  - Регистрация в системном диалоге **"Открыть с помощью..."** (Open With).
  - Генерация автономного файла `dist/register-vibepad.reg` для разворачивания без админ-прав.

---

## 🔥 Key Features & Edge Cases

1. **Large File Handling (>50MB)**: Авто-переход в Safe Performance Mode (отключение тяжелых синтаксических парсеров для предотвращения зависания UI).
2. **Encodings & Line Endings**: Авто-детекция `UTF-8`, `UTF-8 BOM`, `UTF-16`, `Windows-1251 (ANSI)` (с проверкой валидности многобайтовых последовательностей) + переключатель `CRLF`/`LF`.
3. **Unicode Base64 & DevTools**: Нативный Unicode Base64 кодер (`TextEncoder`/`TextDecoder`), защищенный от крэшей при работе с кириллицей, безопасный парсинг JWT и устойчивый CSV-трансформер.
4. **Sublime Multi-Cursor & Search**: `Ctrl+D` (выделение совпадений), `Alt+Click` (мультикурсоры), Regex Search & Replace (`Ctrl+F` / `Ctrl+H`).
5. **Live Log Tail & Smart Filter (`Ctrl+Shift+F`)**:
   - Слежение за авто-обновлением лог-файлов в реальном времени.
   - Мгновенный фильтр строк по ключам (`[ERROR]`, `[WARN]`, `[INFO]`).
6. **Split-View File Diff (`Ctrl+Shift+D`)**: 2-панельное сравнение файлов или выделенного текста.
7. **Smart Context Floating Bar**: Авто-детекция выделенного текста (Unix Timestamp -> дата, Base64 -> расшифровка, JSON -> форматирование, `Ctrl+K` -> AI).
8. **Hot-Exit & QuotaExceeded Safe Session**: Автосохранение открытых вкладок и неименованных черновиков (`Untitled-1`). Защита `localStorage` от переполнения квоты при больших файлах.
9. **Quick Shell Runner (`Alt+X`)**: Выполнение выделенного кода/скрипта с выводом в консольную панель.
10. **Antigravity AI Sidecar (`Ctrl+K`)**: Всплывающий AI-промпт с интерактивным Diff-превью и кнопкой "Apply Diff".

---

## 📁 Project Structure

```
vibe-pad/
├── GEMINI.md                         # Документ памяти сессий и архитектуры
├── .gitignore                        # Исключения node_modules, dist, temp артефактов
├── package.json                      # Конфигурация зависимостей и npm скриптов
├── vite.config.ts                    # Конфиг сборщика Vite
├── tailwind.config.js                # Стили и Glassmorphism токены
├── neutralino.config.json            # Конфигурация нативного движка Neutralino
├── scripts/
│   ├── register-windows.js           # Регистрация контекстного меню Windows Explorer & генерация .reg
│   └── build-exe.js                  # Сборка бинарника VibePad.exe с автокопированием resources.neu
├── public/
│   └── vibe-icon.svg                 # Иконка VibePad
└── src/
    ├── main.tsx                      # Точка входа React с ErrorBoundary
    ├── App.tsx                       # Главный макет, вкладки с UUID, Hot-Exit сессия, Toast-уведомления
    ├── index.css                     # Tailwind & Glassmorphic стили
    ├── components/
    │   ├── ErrorBoundary.tsx         # Перехватчик рантайм-ошибок и восстановление
    │   ├── Editor.tsx                # CodeMirror 6 wrapper с оптимизированным updateListener
    │   ├── MarkdownViewer.tsx        # HTML рендерер для Markdown (Ctrl+E)
    │   ├── DiffViewer.tsx            # Side-by-Side 2-панельный дифф
    │   ├── AntigravityPrompt.tsx     # Floating AI Sidebar с обработкой ошибок
    │   ├── CommandPalette.tsx        # Fuzzy finder (Ctrl+P) с клавиатурной навигацией
    │   ├── QuickContextBar.tsx       # Всплывающая плашка на выделение (Timestamp/Base64/JSON)
    │   └── LogFilterBar.tsx          # Live Log Tail & Smart Filter
    └── utils/
        ├── ipcBridge.ts              # Гибридный IPC мост (Neutralino + HTTP Server + Shell Escape)
        ├── encodings.ts              # Детекция BOM, UTF-8 и Win-1251
        └── devTools.ts               # Safe Unicode Base64, JWT, JSON, Log Cleaner утилиты
```

---

## 🛠️ Build & Run Commands

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск в режиме разработки
npm run dev

# 3. Продашкен сборка веб-бандла
npm run build

# 4. Сборка готового исполняемого файла VibePad.exe (с синхронизацией resources.neu)
npm run build:exe

# 5. Интеграция в контекстное меню Windows Explorer
npm run register
```
