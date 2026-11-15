# Colibri - Project Agents

## Overview
Multi-language LLM inference engine: C/CUDA/Metal core, Python bindings (OpenAI API), React/Vite web UI, Tauri/Rust desktop.

## Agent Usage
- **planner**: Cross-language features, performance optimization
- **tdd-guide**: 
  - C: Custom test framework in `c/tests/`
  - Python: pytest in `c/tools/test_*.py`
  - Web: Vitest + React Testing Library
  - Rust: `cargo test`
- **code-reviewer**: C (memory safety), Python (types), React (hooks), Rust (ownership)
- **security-reviewer**: OpenAI API auth, input validation, WASM sandboxing, rate limiting
- **build-error-resolver**: Make/CMake, `pip`, `npm`, `cargo` build failures
- **go-reviewer** / **go-build-resolver**: Not applicable (C/Python/Rust/TS)

## Project Context
- Core: `c/colibri.c` (400K+ lines), headers in `c/`
- Python: `openai_server.py`, `coli` CLI, quantization tools
- Web: `web/` (React 18, Vite, Tailwind)
- Desktop: `desktop/src-tauri/` (Tauri 2, Rust)
- Build: `make` (C), `python openai_server.py`, `npm run dev` (web), `cargo tauri dev` (desktop)

## ECC Compliance
- Uses global ECC agents, commands, skills
- Multi-language patterns in CLAUDE.md