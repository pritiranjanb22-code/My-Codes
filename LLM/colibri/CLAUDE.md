# Colibri — Project CLAUDE.md

> Multi-language LLM inference engine: C/C++ core, Python bindings, React/Vite web UI, Tauri/Rust desktop

## Project Overview

**Stack:**
- **Core:** C99/CUDA/Metal, single-header library (`colibri.c`/`colibri.h`)
- **Python:** `openai_server.py` (OpenAI-compatible API), `coli` CLI
- **Web:** React 18 + TypeScript + Vite, Tailwind CSS
- **Desktop:** Tauri 2 (Rust + WebView), Tauri plugins
- **Build:** Make, CMake, Nix flake, Docker

**Architecture:** High-performance LLM inference with GPU acceleration (CUDA/Metal), quantization support (IQ3, IQ4, FP8), OpenAI-compatible REST API

## Critical Rules

### Multi-Language Standards

- **C Core:** C99, strict warnings (`-Wall -Wextra -Wpedantic`), no undefined behavior
- **CUDA/Metal:** Separate backends in `backend_cuda.cu`, `backend_metal.mm`
- **Python:** 3.10+, type hints, `pyproject.toml` with `uv`/`pip`
- **Web:** React 18, TypeScript strict, Vite, ESLint + Prettier
- **Rust:** 2021 edition, `cargo fmt`, `cargo clippy`

### Code Organization

- Core C in `colibri/c/` (single-file `colibri.c` + headers)
- Python in `colibri/c/` (`openai_server.py`, `coli`, `tools/`)
- Web in `colibri/web/` (Vite + React)
- Desktop in `colibri/desktop/src-tauri/` (Tauri + Rust)
- Docs in `colibri/docs/` (Markdown)
- Max 800 lines per C file, 400 for others

### Code Style

- No emojis in code, comments, or documentation
- C: `snake_case` for functions, `PascalCase` for types, `UPPER_SNAKE` for macros
- Python: PEP 8, `black` formatting, `mypy` strict
- Web: ESLint (Airbnb/Next.js), Prettier, functional components
- Rust: `rustfmt`, `clippy`, `snake_case`/`PascalCase` conventions

### Testing

- TDD: Write tests first (`/tdd` command)
- C: Custom test framework in `c/tests/` (benchmarks, correctness)
- Python: `pytest` in `c/tests/` (`test_*.py`)
- Web: Vitest + React Testing Library
- Rust: `cargo test`
- Integration: `c/tools/test_*.py` for end-to-end
- 80% minimum coverage for Python/Rust, critical paths in C

### Security

- No hardcoded secrets - `.env` for Python server
- OpenAI server: API key auth via `Authorization: Bearer`
- Input validation: JSON schema validation on all endpoints
- Rate limiting on `/v1/chat/completions`
- C: Bounds checking on all tensor operations
- WASM: No `eval`/`Function` constructor

## File Structure

```
colibri/
|-- c/                          # C Core + Python
|   |-- colibri.c               # Main implementation (400K+ lines)
|   |-- colibri.h               # Public C API
|   |-- *.h                     # Headers (backend_*, tok.h, quant.h, etc.)
|   |-- openai_server.py        # OpenAI-compatible REST API
|   |-- coli                    # CLI entry (Python)
|   |-- tools/                  # Python utilities (quant, convert, eval)
|   |-- tests/                  # C + Python tests
|   |-- scripts/                # Build/run scripts
|   |-- Makefile                # Build system
|   |-- CMakeLists.txt          # CMake alternative
|-- web/                        # React/Vite Web UI
|   |-- src/
|   |   |-- components/ui/      # shadcn/ui components
|   |   |-- lib/                # API client, runtime, storage
|   |   |-- i18n/               # Translations (en, it, zh-CN, zh-TW)
|   |   |-- App.tsx, main.tsx
|   |-- package.json
|   |-- vite.config.ts
|   |-- tsconfig.json
|-- desktop/                    # Tauri Desktop
|   |-- src-tauri/
|   |   |-- src/
|   |   |   |-- main.rs         # Tauri entry
|   |   |   |-- lib.rs          # Commands, state
|   |   |-- Cargo.toml
|   |   |-- tauri.conf.json
|   |-- Cargo.lock
|-- docs/                       # Documentation
|   |-- api.md, benchmarks.md, cuda.md, metal.md, etc.
|-- docker/
|   |-- Dockerfile
|   |-- README.md
|-- .github/workflows/          # CI/CD
|   |-- ci.yml, check.yml, release.yml
|-- flake.nix                   # Nix flake for reproducible builds
|-- pyproject.toml              # Python project config
|-- Makefile                    # Root build
|-- README.md
|-- LICENSE
```

## Key Patterns

### C Core API

```c
// colibri.h - Public API
typedef struct ColiModel ColiModel;
typedef struct ColiContext ColiContext;

ColiModel* coli_model_load(const char* path, const ColiModelParams* params);
void coli_model_free(ColiModel* model);

ColiContext* coli_context_new(ColiModel* model, const ColiContextParams* params);
void coli_context_free(ColiContext* ctx);

int coli_generate(ColiContext* ctx, const ColiTokens* input, ColiTokens* output, ColiSampler* sampler);
```

### Python OpenAI Server

```python
# openai_server.py
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[Message]
    temperature: float = 0.7
    max_tokens: int | None = None
    stream: bool = False

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatCompletionRequest, api_key: str = Depends(verify_api_key)):
    # Validate, call C core via coli bindings, stream response
    return StreamingResponse(generate_stream(req), media_type="text/event-stream")
```

### Web API Client

```typescript
// web/src/lib/api.ts
export async function chatCompletions(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const res = await fetch('/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApiKey()}` },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Tauri Commands

```rust
// desktop/src-tauri/src/lib.rs
#[tauri::command]
async fn generate(state: State<'_, ModelState>, request: GenerateRequest) -> Result<String, String> {
    let model = state.get_model().await?;
    let output = model.generate(request.prompt, request.params).await?;
    Ok(output)
}
```

## Environment Variables

```bash
# Python server (.env)
COLIBRI_MODEL_PATH=/models/llama-3-8b.iq3_xxs.bin
COLIBRI_API_KEY=sk-xxx
COLIBRI_HOST=0.0.0.0
COLIBRI_PORT=8080
COLIBRI_N_GPU_LAYERS=-1
COLIBRI_CTX_SIZE=4096
COLIBRI_THREADS=8

# Web (Vite)
VITE_API_URL=http://localhost:8080

# Tauri (tauri.conf.json > env)
TAURI_API_URL=http://localhost:8080
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors

## Build Commands

```bash
# C Core
cd c && make                    # Build libcolibri.so + coli
cd c && make test               # Run C tests
cd c && python -m pytest tests/ # Run Python tests

# Python Server
cd c && python openai_server.py # Start API server
cd c && python -m coli --help   # CLI help

# Web UI
cd web && npm install
cd web && npm run dev           # Dev server
cd web && npm run build         # Production build
cd web && npm run test          # Vitest
cd web && npx playwright test   # E2E

# Desktop
cd desktop/src-tauri && cargo tauri dev
cd desktop/src-tauri && cargo tauri build

# Docker
docker build -t colibri .
docker run -p 8080:8080 -v /models:/models colibri

# Nix (reproducible)
nix develop                     # Dev shell
nix build                       # Build all
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: C build/test, Python test, Web build/test/lint, Rust build/test/clippy
- Release: `cargo tauri build` + PyPI + GitHub Releases + Docker Hub