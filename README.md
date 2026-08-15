# ⚡ VibePad — Ultra-Fast Electrobun Desktop Text & Code Editor

<div align="center">

[![Electrobun](https://img.shields.io/badge/Runtime-Electrobun_%2F_Bun-f472b6?style=flat-square&logo=bun&logoColor=white)](https://electrobun.dev/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CodeMirror](https://img.shields.io/badge/Editor-CodeMirror_6-D3455B?style=flat-square)](https://codemirror.net/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Status: Paused](https://img.shields.io/badge/Status-Paused%20%2F%20Archived-lightgrey?style=flat-square)](#-project-status)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A lightweight, high-performance desktop code and log editor in the aesthetic of Sublime Text and Linear, featuring cold start <60ms, CodeMirror 6 virtualized scrolling, live log tailing, and built-in SAST code security auditing.**

[Project Status](#-project-status) • [Features](#-key-features) • [Architecture](#-architecture) • [DevTools Suite](#-integrated-devtools-suite) • [Quick Start](#-quick-start) • [License](#-license)

</div>

---

## ⏸️ Project Status

> [!NOTE]
> **DEVELOPMENT STATUS: PAUSED / ARCHIVED**
> Active development on this project is currently on hold. The repository is preserved as an architectural reference and portfolio showcase for high-performance desktop applications built with the **Electrobun** (Bun + WebView2) runtime and CodeMirror 6.

---

## 📖 Overview

**VibePad** is an ultra-lightweight desktop text and code editor engineered for speed. By utilizing **Electrobun** (Bun-powered native host with system WebView2 rendering), it eliminates heavy Electron overhead: starting up in under 60ms, using only ~30MB of RAM, and delivering an instant editing workflow for massive log files, JSON/YAML payloads, SQL queries, and codebases.

---

## ✨ Key Features

- ⚡ **Instant Cold Start (<60ms) & Minimal Memory Footprint (~30MB)**
  - Powered by Bun's native process lifecycle and system WebView2 rendering.
- 📜 **CodeMirror 6 Virtualized Core**
  - High-performance text rendering with multi-cursor editing (`Ctrl+D`, `Alt+Click`), bracket matching, auto-closing tags, and syntax highlighting for 20+ languages.
- 🛡️ **SAST Static Code Security & Secret Scanner**
  - In-editor vulnerability auditor checking for leaked API keys (AWS, GitHub, Stripe, OpenAI), hardcoded secrets, SQL injection patterns, and unsafe `eval()` executions.
- 🔍 **Live Log Tailing & Real-Time Filters (`Ctrl+Shift+F`)**
  - Monitors growing log files on disk with regex highlights and instant search.
- 🛠️ **Integrated Developer Tools Suite (`Ctrl+Shift+V` / `Ctrl+Shift+S`)**
  - Built-in converters for JSON ↔ YAML, Base64 Unicode, JWT decoding, SHA-256 hashing, SQL formatting, cURL → `fetch`, Cron humanizer, and TypeScript type generators.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   VibePad React / TypeScript UI                  │
│       (CodeMirror 6 Core + Glassmorphic HUD + DevTools Modal)    │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Electrobun Typed RPC Bridge
┌─────────────────────────────────▼────────────────────────────────┐
│                   Bun TypeScript Native Process                  │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────────────┐  │
│  │ Non-Blocking File I/O  │  │ Windows Explorer Shell Registry│  │
│  │ (Atomic .vibetmp write)│  │ ("Open with VibePad" Menu)     │  │
│  └────────────────────────┘  └────────────────────────────────┘  │
│  ┌────────────────────────┐  ┌────────────────────────────────┐  │
│  │ SAST Security Engine   │  │ Live Log File Watcher (fs.watch│  │
│  └────────────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Windows System APIs
┌─────────────────────────────────▼────────────────────────────────┐
│               System WebView2 • Windows File System              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Bun**: `v1.1.0` or higher
- **Node.js**: `v18.0.0` or higher

### 1. Installation
```bash
git clone https://github.com/T58574/VibePad.git
cd VibePad
bun install
```

### 2. Run in Development Mode
```bash
bun run dev
```

### 3. Build Standalone Desktop Executable
```cmd
build.bat
```

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
