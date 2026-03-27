# Diet Planner — Tauri v2 Desktop App

## TL;DR

> **Quick Summary**: Build a Tauri v2 desktop app that parses a diet PDF (ABRIL.pdf), lets the user select meals/options over 4 weeks with alternating DIETA 1/DIETA 2, calculates aggregated ingredient quantities, and exports a shopping list CSV.
> 
> **Deliverables**:
> - Python sidecar (`diet_parser`) with 3 CLI subcommands: `parse`, `calculate`, `export`
> - Svelte 5 + TailwindCSS v4 frontend with meal selection UI, dark/light mode, save/load config
> - Tauri v2 shell integration wiring frontend ↔ Python sidecar
> - Portable executable for Linux (Windows build documented as manual step)
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 5 → Task 7 → Task 9 → Task 10 → Task 11 → F1-F4

---

## Context

### Original Request
Build a Tauri v2 prototype desktop app for Windows that parses diet PDFs using Python/pdfplumber, presents a meal selection UI with Svelte+TailwindCSS, calculates ingredient totals across 4 weeks, and exports CSV shopping lists. Single portable exe with no external dependencies.

### Interview Summary
**Key Discussions**:
- **PDF analyzed (ABRIL.pdf)**: 12 pages. Pages 1-6 = diet data (DIETA 1 + DIETA 2), page 7 = supplements (IGNORE), pages 8-12 = exercises (IGNORE)
- **Alternatives with "/"**: User selects ONE per line (radio/dropdown). Selection applies to ALL days that meal is selected.
- **Recipe instructions**: IGNORE completely — only extract ingredient lines
- **Diet assignment**: Alternating automatically (Day 1=DIETA1, Day 2=DIETA2, Day 3=DIETA1...)
- **Persistence**: JSON file in AppData via filesystem
- **All logic in Python**: Parse + calculate + export as sidecar CLI subcommands
- **Prototype quality**: Basic error handling, clean UI, no tests

**Research Findings**:
- Tauri v2 uses capabilities system (not v1 allowlist). Sidecar via `externalBin` + shell plugin
- pdfplumber `extract_text()` works well on ABRIL.pdf — single-column tables with text content
- Svelte 5 with runes ($state, $derived) is current stable
- TailwindCSS v4 with `@tailwindcss/vite` plugin, class-based dark mode
- PyInstaller `--onefile` needs hidden imports for pdfminer.* and PIL.*

### Metis Review
**Identified Gaps** (addressed):
- Golden reference JSON needed for parser validation → Added as Task 3
- "a elegir" items need defined behavior → Included in CSV with quantity "variable"
- Ingredient normalization → Lowercase + trim only (no fuzzy matching)
- Dev platform is Linux, target is Windows → Develop/test on Linux, document Windows build
- Alternative selection scope → ONE choice per line, applies to ALL days (not per-day)
- CSV units → Same ingredient+unit = sum quantities. No unit conversion.

---

## Work Objectives

### Core Objective
Parse ABRIL.pdf into structured diet data, let users plan 4 weeks of meals with alternating diets, and generate an aggregated ingredient shopping list as CSV.

### Concrete Deliverables
- `src-tauri/python/diet_parser.py` — Python sidecar with `parse`, `calculate`, `export` subcommands
- `src/App.svelte` + components — Meal selection UI
- `src-tauri/src/lib.rs` — Tauri IPC commands (thin wrappers calling sidecar)
- `src-tauri/tauri.conf.json` + `capabilities/default.json` — Tauri v2 config
- `tests/fixtures/abril_golden.json` — Golden reference for parser validation
- `tests/fixtures/sample_selection.json` + `expected_totals.json` — Calculation fixtures

### Definition of Done
- [ ] `python diet_parser.py parse ABRIL.pdf` outputs JSON matching golden reference (diff = 0)
- [ ] `python diet_parser.py calculate selection.json` outputs correct aggregated totals
- [ ] `python diet_parser.py export totals.json output.csv` produces valid CSV with BOM
- [ ] Tauri app launches, accepts PDF drag-drop, displays parsed meals, calculates totals, exports CSV
- [ ] Dark/light mode toggle works and persists
- [ ] Save/load meal configuration works via JSON file

### Must Have
- PDF drag-drop or file picker
- Parsed diet structure display (collapsible accordion)
- Week/day grid with alternating DIETA 1/DIETA 2
- Per-meal option selection with alternative radio buttons
- Calculate button → aggregated shopping list display
- Export CSV button with save-as dialog
- Dark/light mode toggle
- Save/load configuration JSON

### Must NOT Have (Guardrails)
- ❌ Generic PDF parser — hardcode ABRIL.pdf patterns only
- ❌ Ingredient editing/CRUD — select from parsed options only
- ❌ Meal plan creation — no custom meals
- ❌ Multi-PDF support — one PDF at a time
- ❌ Unit conversion (don't convert 1000g → 1kg)
- ❌ Fuzzy ingredient matching — exact string match after lowercase+trim
- ❌ Business logic in Rust — Rust is IPC glue ONLY
- ❌ Premature abstractions (no base classes, no strategy patterns)
- ❌ CSS animations or Svelte transitions
- ❌ i18n — all strings hardcoded in Spanish
- ❌ Automated test framework — QA via golden reference diffing + agent Playwright/CLI
- ❌ Windows cross-compilation — develop on Linux, document Windows build as manual step
- ❌ Over-documentation (no JSDoc on every function)
- ❌ Toast notification libraries — simple alert() for errors
- ❌ Per-day alternative selection — ONE choice per "/" line applies to ALL days

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NONE — golden reference diffing instead
- **Framework**: None
- **QA approach**: Agent-executed CLI diffs against golden reference files + Playwright for UI

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Python parser/calculator**: Use Bash — run CLI commands, diff output against golden reference
- **Tauri sidecar IPC**: Use Bash — invoke sidecar binary, verify JSON output
- **Frontend UI**: Use Playwright — navigate, interact, assert DOM, screenshot
- **Config persistence**: Use Bash — verify JSON file written/read from filesystem

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — scaffolding + golden reference):
├── Task 1: Project scaffolding (Tauri + Svelte 5 + TailwindCSS v4) [quick]
├── Task 2: Python sidecar skeleton + pdfplumber raw text extraction [quick]
└── Task 3: Golden reference fixtures (manually extract expected parser output) [unspecified-high]

Wave 2 (After Wave 1 — parser + Tauri config):
├── Task 4: PDF parser — structure extraction (diets → meals → options) [deep]
├── Task 5: PDF parser — ingredient extraction (quantities, alternatives, combinations) [deep]
├── Task 6: Tauri v2 config + sidecar wiring + capabilities [quick]
└── Task 7: Svelte shared state module + TypeScript types [quick]

Wave 3 (After Wave 2 — calculation + UI core):
├── Task 8: Python calculation engine (aggregate ingredients) [unspecified-high]
├── Task 9: Python CSV export with BOM [quick]
├── Task 10: UI — PDF upload + parsed diet display (accordion) [visual-engineering]
└── Task 11: UI — Week/day grid + meal selection + alternative radios [visual-engineering]

Wave 4 (After Wave 3 — integration + polish):
├── Task 12: Full IPC integration (frontend → Rust → sidecar → frontend) [deep]
├── Task 13: UI — Shopping list display + export CSV button [visual-engineering]
├── Task 14: UI — Dark/light mode + save/load config + drag reorder [visual-engineering]
└── Task 15: PyInstaller bundling + sidecar binary placement [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

**Critical Path**: Task 1 → Task 2 → Task 4 → Task 5 → Task 8 → Task 12 → Task 13 → F1-F4 → user okay
**Parallel Speedup**: ~60% faster than sequential
**Max Concurrent**: 4 (Waves 2, 3, 4)

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4,5,6,7,10,11 | 1 |
| 2 | — | 4,5,6,15 | 1 |
| 3 | — | 4,5,8,9 | 1 |
| 4 | 1,2,3 | 5 | 2 |
| 5 | 4 | 8,12 | 2 |
| 6 | 1,2 | 12,15 | 2 |
| 7 | 1 | 10,11,12,13,14 | 2 |
| 8 | 3,5 | 9,12,13 | 3 |
| 9 | 8 | 13 | 3 |
| 10 | 1,7 | 12 | 3 |
| 11 | 1,7 | 12,14 | 3 |
| 12 | 5,6,7,8,10,11 | 13,14 | 4 |
| 13 | 8,9,12 | 14 | 4 |
| 14 | 7,11,12 | — | 4 |
| 15 | 2,6 | — | 4 |

### Agent Dispatch Summary

- **Wave 1**: **3 tasks** — T1 → `quick`, T2 → `quick`, T3 → `unspecified-high`
- **Wave 2**: **4 tasks** — T4 → `deep`, T5 → `deep`, T6 → `quick`, T7 → `quick`
- **Wave 3**: **4 tasks** — T8 → `unspecified-high`, T9 → `quick`, T10 → `visual-engineering`, T11 → `visual-engineering`
- **Wave 4**: **4 tasks** — T12 → `deep`, T13 → `visual-engineering`, T14 → `visual-engineering`, T15 → `quick`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Project Scaffolding — Tauri v2 + Svelte 5 + TailwindCSS v4

  **What to do**:
  - Run `npm create tauri-app@latest` with Svelte + TypeScript template in the project root
  - Verify `svelte` version in `package.json` is 5.x. If 4.x, run `npm install svelte@latest`
  - Install TailwindCSS v4: `npm install tailwindcss @tailwindcss/vite`
  - Configure Vite plugin: add `tailwindcss()` to `vite.config.ts` plugins array
  - Create `src/app.css` with `@import "tailwindcss";` and dark mode variant: `@custom-variant dark (&:where(.dark, .dark *));`
  - Install Tauri shell plugin: `npm install @tauri-apps/plugin-shell` and add `tauri-plugin-shell` to `src-tauri/Cargo.toml`
  - Register shell plugin in `src-tauri/src/lib.rs`: `.plugin(tauri_plugin_shell::init())`
  - Install Tauri dialog plugin: `npm install @tauri-apps/plugin-dialog` and `tauri-plugin-dialog` in Cargo.toml
  - Register dialog plugin in lib.rs
  - Install Tauri fs plugin: `npm install @tauri-apps/plugin-fs` and `tauri-plugin-fs` in Cargo.toml
  - Register fs plugin in lib.rs
  - Create `src-tauri/capabilities/default.json` with permissions: `core:default`, `shell:allow-execute`, `dialog:default`, `fs:default`
  - Configure `tauri.conf.json`: set `productName: "Diet Planner"`, window title, size 1200x800
  - Verify `npm run tauri dev` launches the app with a blank Svelte page
  - Create directory structure: `src/lib/components/`, `src/lib/stores/`, `src-tauri/python/`, `tests/fixtures/`

  **Must NOT do**:
  - Don't add any business logic or UI components beyond the blank scaffold
  - Don't use Svelte 4 patterns (no `$:`, no `writable`/`readable` stores)
  - Don't add CSS animations or transitions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding is a well-defined sequence of install/config steps with clear expected output
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work in this task, just scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 10, 11
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - Tauri v2 scaffold: `npm create tauri-app@latest -- --template svelte-ts --manager npm`
  - TailwindCSS v4 + Vite: `@tailwindcss/vite` plugin in `vite.config.ts`

  **API/Type References**:
  - Tauri v2 capabilities schema: `$schema: "../gen/schemas/desktop-schema.json"` in capabilities JSON
  - Shell plugin permission: `"shell:allow-execute"` with `"sidecar": true` scope

  **External References**:
  - Tauri v2 shell plugin: https://v2.tauri.app/plugin/shell/
  - TailwindCSS v4: https://tailwindcss.com/docs/installation/vite

  **WHY Each Reference Matters**:
  - The shell plugin setup is critical — it's the bridge to the Python sidecar. Must be configured correctly with permissions or sidecar invocation fails silently.
  - TailwindCSS v4 has a completely different setup from v3 (no `tailwind.config.js`, uses CSS `@import` instead). Using v3 patterns will fail.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: App launches in dev mode
    Tool: Bash
    Preconditions: Project scaffolded, dependencies installed
    Steps:
      1. Run `npm run tauri dev` in background, wait 30s for compilation
      2. Check process is running: `ps aux | grep tauri`
      3. Check dev server responds: `curl -s http://localhost:5173 | head -20`
      4. Kill the process
    Expected Result: Dev server responds with HTML containing Svelte app mount point
    Failure Indicators: Process exits with error, dev server doesn't respond, Rust compilation fails
    Evidence: .sisyphus/evidence/task-1-dev-launch.txt

  Scenario: TailwindCSS classes work
    Tool: Bash
    Preconditions: Dev server running
    Steps:
      1. Check `src/app.css` contains `@import "tailwindcss"`
      2. Check `vite.config.ts` contains `tailwindcss()` in plugins
      3. Verify Svelte version: `node -e "console.log(require('./node_modules/svelte/package.json').version)"` → must start with "5."
    Expected Result: TailwindCSS v4 configured, Svelte 5.x confirmed
    Failure Indicators: Missing import, wrong Svelte version, missing vite plugin
    Evidence: .sisyphus/evidence/task-1-tailwind-svelte-version.txt

  Scenario: Tauri plugins registered
    Tool: Bash
    Preconditions: Project scaffolded
    Steps:
      1. Check `src-tauri/Cargo.toml` contains `tauri-plugin-shell`, `tauri-plugin-dialog`, `tauri-plugin-fs`
      2. Check `src-tauri/src/lib.rs` contains `.plugin(tauri_plugin_shell::init())`
      3. Check `src-tauri/capabilities/default.json` contains `"shell:allow-execute"`
      4. Run `cargo check` in `src-tauri/` to verify Rust compiles
    Expected Result: All 3 plugins declared in Cargo.toml, registered in lib.rs, permissions granted
    Failure Indicators: Missing plugin declaration, permission not granted, cargo check fails
    Evidence: .sisyphus/evidence/task-1-plugins-check.txt
  ```

  **Commit**: YES (group 1)
  - Message: `feat(scaffold): init Tauri v2 + Svelte 5 + TailwindCSS v4`
  - Files: All scaffolded files
  - Pre-commit: `cargo check` in src-tauri/

- [ ] 2. Python Sidecar Skeleton + Raw Text Extraction

  **What to do**:
  - Create `src-tauri/python/diet_parser.py` with CLI subcommand structure using `argparse`
  - Implement 3 subcommands: `parse <pdf_path>`, `calculate <selection_json_path>`, `export <totals_json_path> <output_csv_path>`
  - For now, only implement `parse` — the others return `{"error": "not implemented"}`
  - `parse` subcommand: open PDF with pdfplumber, extract text from pages 1-6 only (skip pages 7+)
  - Output raw extracted text as JSON: `{"status": "ok", "pages": [{"page": 1, "text": "..."}, ...]}`
  - Add basic error handling: file not found, invalid PDF, password-protected PDF
  - All output goes to stdout as JSON. Errors also as JSON: `{"status": "error", "message": "..."}`
  - Create `src-tauri/python/requirements.txt` with `pdfplumber>=0.11.0`
  - Create `tests/fixtures/abril_raw_pages.txt` — save raw pdfplumber text output for reference
  - Verify by running: `python diet_parser.py parse ../../ABRIL.pdf`

  **Must NOT do**:
  - Don't parse the structure yet (no regex, no diet/meal detection) — just raw text extraction
  - Don't import any libraries beyond pdfplumber, json, argparse, sys
  - Don't create a stdin loop — CLI subcommands only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple Python CLI skeleton with single library call — well-defined, small scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 6, 15
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - pdfplumber text extraction: `page.extract_text()` returns string with newlines
  - argparse subcommands: `subparsers = parser.add_subparsers(dest='command')`

  **External References**:
  - pdfplumber docs: https://github.com/jsvine/pdfplumber#extracting-text

  **WHY Each Reference Matters**:
  - The raw text output from pdfplumber is the foundation — all subsequent parsing depends on understanding exactly what text pdfplumber produces from this specific PDF. The raw text fixture is essential for debugging parser issues later.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Parse command extracts text from ABRIL.pdf
    Tool: Bash
    Preconditions: Python env with pdfplumber installed, ABRIL.pdf in project root
    Steps:
      1. Run: `python src-tauri/python/diet_parser.py parse ABRIL.pdf`
      2. Pipe output through `python -m json.tool` to validate JSON
      3. Check output contains: "status": "ok", "pages" array with 6 entries (pages 1-6 only)
      4. Check page 1 text contains "DIETA 1" and "ALMUERZO"
      5. Check page 4 text contains "DIETA 2"
      6. Verify pages 7-12 (exercises) are NOT in output
    Expected Result: Valid JSON with 6 pages of diet text, no exercise content
    Failure Indicators: JSON parse error, wrong page count, exercise text present
    Evidence: .sisyphus/evidence/task-2-parse-raw.json

  Scenario: Error handling for missing file
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: `python src-tauri/python/diet_parser.py parse nonexistent.pdf`
      2. Check output is valid JSON with "status": "error"
    Expected Result: `{"status": "error", "message": "..."}` (not a Python traceback)
    Failure Indicators: Python traceback instead of JSON error
    Evidence: .sisyphus/evidence/task-2-error-handling.txt
  ```

  **Commit**: YES (group 2)
  - Message: `feat(parser): Python sidecar skeleton + raw text extraction`
  - Files: `src-tauri/python/diet_parser.py`, `src-tauri/python/requirements.txt`, `tests/fixtures/abril_raw_pages.txt`
  - Pre-commit: `python diet_parser.py parse ABRIL.pdf | python -m json.tool`

- [ ] 3. Golden Reference Fixtures

  **What to do**:
  - Based on the raw extracted text from Task 2 and the actual ABRIL.pdf content, manually construct the golden reference JSON
  - Create `tests/fixtures/abril_golden.json` with the EXACT expected parser output structure:
    ```json
    {
      "status": "ok",
      "diets": [
        {
          "name": "DIETA 1",
          "intro": "HAREMOS AYUNAS HASTA LA HORA DEL ALMUERZO...",
          "meals": [
            {
              "type": "ALMUERZO",
              "options": [
                {
                  "name": "ALMUERZO",
                  "description": null,
                  "ingredient_lines": [
                    {
                      "items": [
                        {"name": "Barra de Pan a elegir", "quantity": 100, "unit": "g"},
                        {"name": "Pan de brioche", "quantity": 80, "unit": "g"}
                      ],
                      "is_alternatives": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    ```
  - Include ALL diets, ALL meals, ALL options, ALL ingredient lines from pages 1-6
  - For each ingredient line with "/": set `is_alternatives: true` and list ALL alternatives in `items`
  - For each ingredient line with "+": set `is_alternatives: false` (combination — need ALL items)
  - For items without quantity: `quantity: null, unit: null`
  - For fractional quantities: use float (`0.5` for ½)
  - For count items: `quantity: 1, unit: "unidad"` (or `2, "unidades"`)
  - For "a elegir" items with free quantity: `quantity: null, unit: null, note: "cantidad libre"`
  - EXCLUDE recipe instruction text — only ingredient lines starting with "-"
  - Create `tests/fixtures/sample_selection.json` — example selection for 7 days (1 week):
    Day 1 (DIETA 1): ALMUERZO option 1, COMIDA option 1, MERIENDA, CENA option 1
    Day 2 (DIETA 2): ALMUERZO option 1, COMIDA option 1, MERIENDA, CENA option 1
    ... alternating for 7 days, with specific alternative choices per ingredient line
  - Create `tests/fixtures/expected_totals.json` — manually calculated expected aggregation for the sample selection
  - Create `tests/fixtures/expected_export.csv` — expected CSV output for the sample totals

  **Must NOT do**:
  - Don't write any parser code — this is manual data extraction
  - Don't guess quantities — verify against the PDF text carefully
  - Don't include supplements (page 7) or exercises (pages 8-12)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires careful manual data extraction from 6 pages of PDF content, attention to detail with quantities and alternatives. Not complex logic but labor-intensive and accuracy-critical.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 5, 8, 9
  - **Blocked By**: None (can start immediately — uses raw PDF text from extraction output in task description context)

  **References**:

  **Pattern References**:
  - PDF content pages 1-6 — the extracted text is available in this plan's Context section and was fully extracted during planning. The agent should use `python` with pdfplumber to re-extract the text and cross-reference.
  - DIETA 1 ALMUERZO (page 1): `-100g de Barra de Pan a elegir / 80g de Pan de brioche`
  - DIETA 1 COMIDA OPCIÓN 1 (page 1): `-120g de Barra de pan a elegir`, `-1 Huevo / 60g de Pavo / ...`
  - DIETA 1 COMIDA OPCIÓN 2 (page 2): `-80g de Arroz blanco / 80g de Pasta / ...`
  - DIETA 1 MERIENDA (page 2): `-Cortado / Infusión a elegir / ...`
  - DIETA 1 CENA 1-3 (pages 2-3): Various options with different naming patterns
  - DIETA 2 follows same structure on pages 4-6

  **WHY Each Reference Matters**:
  - The golden reference IS the acceptance criteria for the parser. If this file is wrong, every subsequent validation is meaningless. It must be painstakingly accurate.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Golden reference JSON is valid and complete
    Tool: Bash
    Preconditions: Golden reference file created
    Steps:
      1. Validate JSON: `python -m json.tool tests/fixtures/abril_golden.json > /dev/null`
      2. Check structure: `python -c "import json; d=json.load(open('tests/fixtures/abril_golden.json')); print(len(d['diets']), 'diets')"` → must be 2
      3. Check DIETA 1 has 4 meal types: ALMUERZO, COMIDA, MERIENDA, CENA
      4. Check DIETA 2 has 4 meal types: ALMUERZO, COMIDA, MERIENDA, CENA
      5. Count total options across both diets — verify matches PDF structure
      6. Spot-check 3 ingredient lines against PDF text for accuracy
    Expected Result: 2 diets, 8 meal sections total, correct option counts, ingredients match PDF
    Failure Indicators: Invalid JSON, wrong diet count, missing meals, wrong quantities
    Evidence: .sisyphus/evidence/task-3-golden-validation.txt

  Scenario: Sample selection and expected totals are consistent
    Tool: Bash
    Preconditions: All fixture files created
    Steps:
      1. Validate `tests/fixtures/sample_selection.json` is valid JSON
      2. Check it contains 7 days with alternating diet assignments
      3. Validate `tests/fixtures/expected_totals.json` is valid JSON
      4. Verify at least one ingredient total is manually correct (e.g., if "Barra de Pan 100g" selected 4 days → 400g)
    Expected Result: All fixtures valid, internally consistent
    Failure Indicators: Invalid JSON, wrong day count, calculation mismatch
    Evidence: .sisyphus/evidence/task-3-fixtures-validation.txt
  ```

  **Commit**: YES (group 2)
  - Message: `feat(fixtures): golden reference + sample selection + expected totals`
  - Files: `tests/fixtures/abril_golden.json`, `tests/fixtures/sample_selection.json`, `tests/fixtures/expected_totals.json`, `tests/fixtures/expected_export.csv`
  - Pre-commit: `python -m json.tool tests/fixtures/abril_golden.json > /dev/null`

- [ ] 4. PDF Parser — Structure Extraction (Diets → Meals → Options)

  **What to do**:
  - Extend `diet_parser.py` `parse` subcommand to detect and split text into structured sections
  - Step 1: Split full text into DIETA 1 and DIETA 2 sections using regex `r'DIETA\s+(\d+)'`
  - Step 2: Within each diet, split into meal sections: ALMUERZO, COMIDA, MERIENDA, CENA using regex `r'(ALMUERZO|COMIDA|MERIENDA|CENA)'`
  - Step 3: Within each meal, detect options using flexible regex that handles ALL naming patterns:
    - `OPCIÓN N` (standard)
    - `OPCIÓN N – DESCRIPTION` (with title)
    - `OPCIÓN N DE COMIDA – DESCRIPTION` (DIETA 2 style)
    - `CENA N – DESCRIPTION` (DIETA 1 cena style)
    - If no option header found, treat entire meal block as a single option (ALMUERZO in DIETA 1, MERIENDA in both)
  - Output JSON structure: `{"status": "ok", "diets": [{"name": "DIETA 1", "meals": [{"type": "ALMUERZO", "options": [{"name": "...", "raw_text": "..."}]}]}]}`
  - At this stage, `raw_text` contains the unparsed ingredient text for each option
  - Handle the "intro" text ("HAREMOS AYUNAS...") — store as diet-level field, don't parse as meal

  **Must NOT do**:
  - Don't parse individual ingredients yet (Task 5 handles that)
  - Don't add complex error recovery — if structure detection fails, return error JSON
  - Don't try to handle PDFs other than ABRIL.pdf format

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex regex work with inconsistent PDF patterns. Requires careful text analysis and handling edge cases in option naming.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7) — BUT Task 5 depends on Task 4
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `src-tauri/python/diet_parser.py` — extend the parse subcommand from Task 2
  - `tests/fixtures/abril_golden.json` — validate structure matches expected diet/meal/option counts

  **External References**:
  - PDF text structure (from extraction during planning):
    - Page 1: `"DIETA 1"` header → `"ALMUERZO"` → `"COMIDA"` → `"OPCIÓN 1 BOCATA"`
    - Page 2: `"OPCIÓN 2 – COMIDA RAPIDA Y SENCILLA"` → `"MERIENDA"` → `"CENA"` → `"CENA 1 – NUGGETS HEALTHY"`
    - Page 3: `"OPCIÓN 2"` (no prefix) → `"CENA 3 – ENSALADA GRIEGA"`
    - Page 4: `"DIETA 2"` → `"ALMUERZO"` → `"OPCIÓN 1"` → `"OPCIÓN 2 – BOLLITO A LA TAZA"` → `"COMIDA"` → `"OPCIÓN 1 – ENSALADA DE LEGUMBRES"`
    - Page 5: `"OPCIÓN 2 DE COMIDA – WRAP SALUDABLE"` → `"MERIENDA"` → `"CENA"` → `"OPCIÓN 1 DE CENA"`
    - Page 6: `"OPCIÓN 2 DE CENA – BURRITO"` → `"OPCIÓN 3 DE CENA – TORTILLA DE PATATAAIR FRYER"`

  **WHY Each Reference Matters**:
  - The inconsistent naming is the #1 challenge. The regex must handle "CENA 1", "OPCIÓN 1", "OPCIÓN 2 DE CENA", and "OPCIÓN 2 DE COMIDA" as valid option headers. Missing any pattern = lost ingredients.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Structure extraction matches expected diet/meal/option counts
    Tool: Bash
    Preconditions: ABRIL.pdf in project root, Tasks 1-3 complete
    Steps:
      1. Run: `python src-tauri/python/diet_parser.py parse ABRIL.pdf > /tmp/parsed.json`
      2. Validate JSON: `python -m json.tool /tmp/parsed.json > /dev/null`
      3. Check: `python -c "import json; d=json.load(open('/tmp/parsed.json')); assert len(d['diets'])==2, f'Expected 2 diets, got {len(d[\"diets\"])}'"` 
      4. Check DIETA 1 meals: ALMUERZO(1 option), COMIDA(2 options), MERIENDA(1 option), CENA(3 options)
      5. Check DIETA 2 meals: ALMUERZO(2 options), COMIDA(2 options), MERIENDA(1 option), CENA(3 options)
      6. Verify no option's raw_text contains "DIETA" or meal-level headers (proves splitting worked)
    Expected Result: 2 diets × 4 meals each. Option counts: D1=[1,2,1,3], D2=[2,2,1,3]
    Failure Indicators: Wrong diet/meal/option count, headers leaking into raw_text
    Evidence: .sisyphus/evidence/task-4-structure.json

  Scenario: Recipe intro text excluded from meals
    Tool: Bash
    Preconditions: Parse output available
    Steps:
      1. Check that "HAREMOS AYUNAS" does NOT appear in any meal option's raw_text
      2. Check it appears as a diet-level "intro" field
    Expected Result: Intro text stored at diet level, not in any meal
    Failure Indicators: Intro text appears inside an option
    Evidence: .sisyphus/evidence/task-4-intro-check.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(parser): structure extraction — diets, meals, options`
  - Files: `src-tauri/python/diet_parser.py`
  - Pre-commit: `python diet_parser.py parse ABRIL.pdf | python -c "import json,sys; d=json.load(sys.stdin); assert len(d['diets'])==2"`

- [ ] 5. PDF Parser — Ingredient Extraction (Quantities, Alternatives, Combinations)

  **What to do**:
  - Extend the `parse` subcommand to parse `raw_text` within each option into structured ingredient lines
  - For each line starting with "-":
    - Detect if line contains "/" → mark as `is_alternatives: true`, split into individual items
    - Detect if line contains "+" → mark as `is_combination: true`, split into individual items (user needs ALL)
    - For each item, extract: `name` (string), `quantity` (float|null), `unit` (string|null)
  - Quantity extraction regex: handle `100g`, `40ml`, `1`, `½`, `2-3` (take first number), `1 Cucharada`
  - Unit normalization: `g`, `ml`, `unidad` (for counts), `cucharada`, `onza`, `puñado`, `loncha`, `vasito`, `bola`, `lata`
  - Handle multi-line items: if a line doesn't start with "-" and previous line was an ingredient, join with previous
  - Filter out recipe instruction text: lines NOT starting with "-" that form complete sentences (contain verbs like "vamos", "cortamos", "cuando")
  - Filter out parenthetical instructions: "(ensalada, plancha, horno, NI PATATA...)" — store as `note` field
  - Handle "a elegir" items: `quantity: null, unit: null, note: "a elegir"`
  - Replace `raw_text` with `ingredient_lines` array in the output
  - Validate output against `tests/fixtures/abril_golden.json` using diff

  **Must NOT do**:
  - Don't do fuzzy ingredient matching or normalization beyond lowercase+trim
  - Don't convert units (no g→kg conversion)
  - Don't try to handle PDFs other than ABRIL.pdf format
  - Don't add logging framework — use `print(..., file=sys.stderr)` for debug if needed

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex regex parsing with many edge cases (multi-line, mixed formats, recipe text filtering). Highest risk task in the project.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 4)
  - **Parallel Group**: Wave 2 (starts after Task 4 completes)
  - **Blocks**: Tasks 8, 12
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `src-tauri/python/diet_parser.py` — extend parser from Task 4
  - `tests/fixtures/abril_golden.json` — THE validation reference. Parser output must match this exactly.

  **External References**:
  - Ingredient format examples from PDF:
    - Simple: `-100g de Barra de Pan a elegir` → `{name: "Barra de Pan", quantity: 100, unit: "g", note: "a elegir"}`
    - Alternatives: `-100g de Pechuga de pollo / 100g de Pechuga de pavo` → `{is_alternatives: true, items: [{name: "Pechuga de pollo", quantity: 100, unit: "g"}, ...]}`
    - Combination: `-50g de Aguacate + 50g de Philadelphia light` → `{is_combination: true, items: [{name: "Aguacate", quantity: 50, unit: "g"}, ...]}`
    - Count: `-1 Huevo` → `{name: "Huevo", quantity: 1, unit: "unidad"}`
    - Fraction: `-½ Bola de mozzarella light` → `{name: "Bola de mozzarella light", quantity: 0.5, unit: "unidad"}`
    - No quantity: `-Tomate triturado` → `{name: "Tomate triturado", quantity: null, unit: null}`
    - Free: `-Verduras a elegir (CANTIDAD LIBRE)` → `{name: "Verduras", quantity: null, unit: null, note: "cantidad libre, a elegir"}`
    - Recipe to SKIP: `"Vamos a cortar el salmón a taquitos..."` → NOT an ingredient line

  **WHY Each Reference Matters**:
  - The golden reference is the ONLY reliable way to validate parsing accuracy across 50+ ingredient lines with various formats. The diff must be zero.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full parse output matches golden reference
    Tool: Bash
    Preconditions: Tasks 2-4 complete, golden reference exists
    Steps:
      1. Run: `python src-tauri/python/diet_parser.py parse ABRIL.pdf > /tmp/actual.json`
      2. Run: `python -c "
import json
actual = json.load(open('/tmp/actual.json'))
golden = json.load(open('tests/fixtures/abril_golden.json'))
# Compare structure
assert actual['status'] == golden['status']
assert len(actual['diets']) == len(golden['diets'])
for i, (a, g) in enumerate(zip(actual['diets'], golden['diets'])):
    assert a['name'] == g['name'], f'Diet {i} name mismatch'
    for j, (am, gm) in enumerate(zip(a['meals'], g['meals'])):
        assert am['type'] == gm['type'], f'Diet {i} meal {j} type mismatch'
        assert len(am['options']) == len(gm['options']), f'Diet {i} meal {j} option count mismatch: {len(am[\"options\"])} vs {len(gm[\"options\"])}'
print('Structure matches golden reference')
"`
      3. Spot-check 5 specific ingredients for correct quantity/unit parsing
    Expected Result: Zero structural differences, ingredient parsing matches golden reference
    Failure Indicators: Any assertion fails, ingredient quantity/unit mismatch
    Evidence: .sisyphus/evidence/task-5-golden-diff.txt

  Scenario: Recipe text filtered out
    Tool: Bash
    Preconditions: Parse complete
    Steps:
      1. Run parse, search all ingredient names for recipe verbs: "vamos", "cortamos", "cuando", "llevamos"
      2. `python -c "import json; d=json.load(open('/tmp/actual.json')); [print(f'RECIPE LEAK: {item}') for diet in d['diets'] for meal in diet['meals'] for opt in meal['options'] for line in opt['ingredient_lines'] for item in (line.get('items', [line]) if isinstance(line, dict) else [line]) if any(v in str(item.get('name','')).lower() for v in ['vamos','cortamos','cuando','llevamos','microondas','sartén'])]"`
    Expected Result: Zero recipe text in ingredient names
    Failure Indicators: Any recipe verb found in ingredient names
    Evidence: .sisyphus/evidence/task-5-no-recipes.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(parser): ingredient extraction with alternatives and combinations`
  - Files: `src-tauri/python/diet_parser.py`
  - Pre-commit: `python diet_parser.py parse ABRIL.pdf | python -m json.tool > /dev/null`

- [ ] 6. Tauri v2 Config + Sidecar Wiring + IPC Commands

  **What to do**:
  - Configure `externalBin` in `tauri.conf.json`: `"externalBin": ["binaries/diet_parser"]`
  - Create placeholder sidecar binary for development: copy a test script to `src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu` (for Linux dev) that wraps the Python script
  - For development: the "sidecar" can be a shell script that calls `python3 src-tauri/python/diet_parser.py "$@"` — this avoids needing PyInstaller during dev
  - Define 3 Tauri commands in `src-tauri/src/lib.rs`:
    - `parse_pdf(app: AppHandle, path: String) -> Result<String, String>` — calls sidecar with `["parse", path]`
    - `calculate_totals(app: AppHandle, selection_json: String) -> Result<String, String>` — calls sidecar with `["calculate"]` and passes selection JSON via temp file
    - `export_csv(app: AppHandle, totals_json: String, output_path: String) -> Result<String, String>` — calls sidecar with `["export", totals_path, output_path]`
  - Register all 3 commands in `generate_handler![]`
  - Update `src-tauri/capabilities/default.json` with shell:allow-execute permission scoped to sidecar
  - Verify the sidecar can be invoked from Rust: `cargo test` or manual invoke

  **Must NOT do**:
  - Don't put business logic in Rust — pure IPC forwarding only
  - Don't use stdin/stdout streaming — simple execute + capture output
  - Don't handle Windows sidecar naming yet (Task 15)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-defined Tauri plugin configuration + 3 thin command wrappers. Small scope, clear patterns.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Tasks 12, 15
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src-tauri/src/lib.rs` — scaffold from Task 1, extend with commands
  - `src-tauri/tauri.conf.json` — add `externalBin` field

  **API/Type References**:
  - Tauri v2 shell sidecar: `app.shell().sidecar("binaries/diet_parser").args(["parse", &path]).output().await`
  - Command return type: `Result<String, String>` for JSON string passthrough

  **External References**:
  - Tauri v2 sidecar docs: https://v2.tauri.app/plugin/shell/
  - Shell plugin permissions: `shell:allow-execute` with sidecar scope

  **WHY Each Reference Matters**:
  - The sidecar invocation pattern is the core integration point. If the shell command, permissions, or binary naming are wrong, the entire app fails to communicate with Python.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Sidecar invocable from Tauri
    Tool: Bash
    Preconditions: Tasks 1, 2 complete, sidecar script in place
    Steps:
      1. Verify sidecar script exists: `ls -la src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu`
      2. Verify it's executable: `test -x src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu`
      3. Run directly: `src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu parse ABRIL.pdf | python -m json.tool > /dev/null`
      4. Verify `cargo check` passes in src-tauri/
    Expected Result: Sidecar script runs, produces valid JSON, Rust compiles
    Failure Indicators: Script not found, not executable, Rust compilation error
    Evidence: .sisyphus/evidence/task-6-sidecar-check.txt

  Scenario: Tauri commands defined and compile
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Check `src-tauri/src/lib.rs` contains `parse_pdf`, `calculate_totals`, `export_csv` functions
      2. Check `generate_handler!` includes all 3 commands
      3. Run `cargo check` in src-tauri/ — must pass
    Expected Result: All 3 commands defined, registered, and compile
    Failure Indicators: Missing command, registration error, compilation failure
    Evidence: .sisyphus/evidence/task-6-commands-check.txt
  ```

  **Commit**: YES (group 4)
  - Message: `feat(sidecar): Tauri v2 shell plugin wiring + IPC commands`
  - Files: `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu`
  - Pre-commit: `cargo check` in src-tauri/

- [ ] 7. Svelte Shared State Module + TypeScript Types

  **What to do**:
  - Create `src/lib/types.ts` with TypeScript interfaces matching the parser JSON output:
    ```typescript
    interface DietPlan { name: string; intro: string; meals: Meal[] }
    interface Meal { type: MealType; options: MealOption[] }
    type MealType = 'ALMUERZO' | 'COMIDA' | 'MERIENDA' | 'CENA'
    interface MealOption { name: string; description: string | null; ingredient_lines: IngredientLine[] }
    interface IngredientLine { items: IngredientItem[]; is_alternatives: boolean; is_combination: boolean }
    interface IngredientItem { name: string; quantity: number | null; unit: string | null; note: string | null }
    interface ParseResult { status: string; diets: DietPlan[] }
    interface DaySelection { day: number; diet: 'DIETA 1' | 'DIETA 2'; meals: MealSelection[] }
    interface MealSelection { type: MealType; selected_option_index: number; alternative_choices: Record<number, number> }
    interface WeekConfig { weeks: number; days: DaySelection[] }
    interface ShoppingItem { name: string; quantity: number | null; unit: string | null; count: number }
    ```
  - Create `src/lib/state.svelte.ts` with Svelte 5 runes shared state:
    ```typescript
    // Global app state using Svelte 5 runes
    export const appState = $state({
      parsedData: null as ParseResult | null,
      pdfPath: null as string | null,
      weekConfig: createDefaultWeekConfig(),
      shoppingList: [] as ShoppingItem[],
      darkMode: false,
      loading: false,
      error: null as string | null,
    })
    ```
  - Create `src/lib/utils.ts` with helper functions:
    - `createDefaultWeekConfig(weeks: number)` — generates 28 days with alternating DIETA 1/2
    - `formatQuantity(qty: number | null, unit: string | null)` — display helper

  **Must NOT do**:
  - Don't use Svelte 4 stores (`writable`, `readable`, `derived`)
  - Don't use `$:` reactive declarations
  - Don't add any UI components — just types and state

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definitions and state module — clear structure, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Tasks 10, 11, 12, 13, 14
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `tests/fixtures/abril_golden.json` — TypeScript types must match this JSON structure exactly
  - Svelte 5 runes: `$state()` for reactive state, exported from `.svelte.ts` files

  **External References**:
  - Svelte 5 runes: https://svelte.dev/docs/svelte/$state

  **WHY Each Reference Matters**:
  - Types must match the parser output exactly or the frontend will have type errors when processing parse results. The golden reference JSON is the contract.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TypeScript types compile without errors
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Run `npx tsc --noEmit` from project root
      2. Verify zero errors related to `src/lib/types.ts` or `src/lib/state.svelte.ts`
    Expected Result: TypeScript compilation passes
    Failure Indicators: Type errors, import resolution failures
    Evidence: .sisyphus/evidence/task-7-tsc-check.txt

  Scenario: No Svelte 4 patterns used
    Tool: Bash
    Preconditions: State module created
    Steps:
      1. Search for Svelte 4 patterns: `grep -r 'writable\|readable\|derived.*from.*svelte/store\|\$:' src/lib/`
      2. Verify `src/lib/state.svelte.ts` uses `$state` and `$derived` only
    Expected Result: Zero Svelte 4 patterns found
    Failure Indicators: Any `writable`, `readable`, `$:` found in source
    Evidence: .sisyphus/evidence/task-7-no-svelte4.txt
  ```

  **Commit**: YES (group 4)
  - Message: `feat(types): TypeScript types + Svelte 5 shared state module`
  - Files: `src/lib/types.ts`, `src/lib/state.svelte.ts`, `src/lib/utils.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 8. Python Calculation Engine — Aggregate Ingredients

  **What to do**:
  - Implement `calculate` subcommand in `diet_parser.py`
  - Input: path to selection JSON file (structure matching `WeekConfig` type from Task 7)
  - The selection JSON references parsed diet data. The `calculate` command must ALSO receive the parsed data (either re-parse the PDF or receive it as a second argument). Decision: **re-parse the PDF** — command becomes `calculate <pdf_path> <selection_json_path>`
  - For each selected day:
    1. Determine diet (DIETA 1 or DIETA 2 based on alternating pattern)
    2. For each meal in that day's selection, find the selected option
    3. For each ingredient line in that option:
       - If `is_alternatives`: use the user's `alternative_choices[line_index]` to pick ONE item
       - If `is_combination`: include ALL items
       - Otherwise: include the single item
  - Aggregate: group by `(lowercase(name), unit)`, sum quantities
  - For items with `quantity: null`: aggregate by count (how many days the item appears)
  - Output JSON: `{"status": "ok", "items": [{"name": "Pechuga de pollo", "quantity": 300, "unit": "g"}, {"name": "Rúcula", "quantity": null, "unit": null, "count": 5}]}`
  - Sort output alphabetically by name

  **Must NOT do**:
  - Don't convert units (no g→kg)
  - Don't do fuzzy ingredient matching — exact lowercase+trim match only
  - Don't add rounding — show exact sums (300.0, not 300)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Business logic with multiple aggregation rules and edge cases. Not algorithmically hard but must handle all ingredient patterns correctly.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11)
  - **Blocks**: Tasks 9, 12, 13
  - **Blocked By**: Tasks 3, 5

  **References**:

  **Pattern References**:
  - `src-tauri/python/diet_parser.py` — extend with `calculate` subcommand
  - `tests/fixtures/sample_selection.json` — input fixture
  - `tests/fixtures/expected_totals.json` — expected output fixture

  **WHY Each Reference Matters**:
  - The selection JSON structure must match what the frontend will produce. The expected totals are the validation fixture — diff must be zero.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Calculate totals match expected fixture
    Tool: Bash
    Preconditions: Tasks 3, 5 complete
    Steps:
      1. Run: `python src-tauri/python/diet_parser.py calculate ABRIL.pdf tests/fixtures/sample_selection.json > /tmp/actual_totals.json`
      2. Validate JSON: `python -m json.tool /tmp/actual_totals.json > /dev/null`
      3. Compare with expected: `python -c "
import json
actual = json.load(open('/tmp/actual_totals.json'))
expected = json.load(open('tests/fixtures/expected_totals.json'))
assert actual['status'] == 'ok'
assert len(actual['items']) == len(expected['items']), f'Item count mismatch: {len(actual[\"items\"])} vs {len(expected[\"items\"])}'
for a, e in zip(sorted(actual['items'], key=lambda x: x['name']), sorted(expected['items'], key=lambda x: x['name'])):
    assert a['name'] == e['name'], f'Name mismatch: {a[\"name\"]} vs {e[\"name\"]}'
    assert a.get('quantity') == e.get('quantity'), f'{a[\"name\"]}: qty {a.get(\"quantity\")} vs {e.get(\"quantity\")}'
print('All totals match')
"`
    Expected Result: All items match expected totals exactly
    Failure Indicators: Item count mismatch, quantity mismatch, missing ingredients
    Evidence: .sisyphus/evidence/task-8-totals-diff.txt

  Scenario: Empty selection produces empty list
    Tool: Bash
    Preconditions: None
    Steps:
      1. Create empty selection: `echo '{"weeks": 4, "days": []}' > /tmp/empty_selection.json`
      2. Run: `python src-tauri/python/diet_parser.py calculate ABRIL.pdf /tmp/empty_selection.json`
      3. Verify output: `{"status": "ok", "items": []}`
    Expected Result: Empty items array, no error
    Failure Indicators: Error or non-empty items
    Evidence: .sisyphus/evidence/task-8-empty-selection.txt
  ```

  **Commit**: YES (group 5)
  - Message: `feat(calc): ingredient aggregation engine`
  - Files: `src-tauri/python/diet_parser.py`
  - Pre-commit: `python diet_parser.py calculate ABRIL.pdf tests/fixtures/sample_selection.json | python -m json.tool`

- [ ] 9. Python CSV Export with BOM

  **What to do**:
  - Implement `export` subcommand in `diet_parser.py`
  - Input: `export <totals_json_path> <output_csv_path>`
  - Read aggregated totals JSON (output of `calculate` command)
  - Write CSV with UTF-8 BOM (`\xEF\xBB\xBF`) for Excel compatibility with Spanish characters
  - CSV columns: `Ingrediente,Cantidad,Unidad`
  - For items with quantity: `"Pechuga de pollo","300","g"`
  - For items without quantity (null): `"Rúcula","5 días","variable"`
  - Sort alphabetically by ingredient name
  - Output JSON confirmation: `{"status": "ok", "path": "/path/to/output.csv", "item_count": N}`

  **Must NOT do**:
  - Don't convert units (no g→kg in CSV)
  - Don't add Excel formatting (.xlsx) — plain CSV only
  - Don't add semicolons as separator — use commas

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file I/O — read JSON, write CSV. Well-defined format, minimal logic.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 13
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `tests/fixtures/expected_totals.json` — input format
  - `tests/fixtures/expected_export.csv` — expected output

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CSV export matches expected fixture
    Tool: Bash
    Preconditions: Task 8 complete
    Steps:
      1. Run: `python src-tauri/python/diet_parser.py export tests/fixtures/expected_totals.json /tmp/actual.csv`
      2. Check BOM: `xxd /tmp/actual.csv | head -1` — must start with `efbb bf`
      3. Check header: `head -1 /tmp/actual.csv` — must be `Ingrediente,Cantidad,Unidad` (after BOM)
      4. Diff: `diff tests/fixtures/expected_export.csv /tmp/actual.csv`
    Expected Result: CSV matches expected, has BOM, correct header and data
    Failure Indicators: Missing BOM, wrong header, data mismatch
    Evidence: .sisyphus/evidence/task-9-csv-export.txt

  Scenario: Spanish characters preserved
    Tool: Bash
    Preconditions: CSV exported
    Steps:
      1. Check for Spanish chars: `grep -P '[áéíóúñÁÉÍÓÚÑ]' /tmp/actual.csv`
    Expected Result: Spanish characters present and correctly encoded
    Failure Indicators: Mojibake, missing accents
    Evidence: .sisyphus/evidence/task-9-encoding.txt
  ```

  **Commit**: YES (group 5)
  - Message: `feat(export): CSV export with UTF-8 BOM`
  - Files: `src-tauri/python/diet_parser.py`
  - Pre-commit: `python diet_parser.py export tests/fixtures/expected_totals.json /tmp/test.csv && file /tmp/test.csv`

- [ ] 10. UI — PDF Upload + Parsed Diet Display (Accordion)

  **What to do**:
  - Create `src/lib/components/PdfUpload.svelte`:
    - Drag & drop zone with visual feedback (dashed border, icon, "Arrastra tu PDF aquí")
    - File input button as fallback: "Seleccionar archivo"
    - Accept only `.pdf` files
    - On file drop/select: call `invoke('parse_pdf', { path })` and store result in `appState.parsedData`
    - Show loading spinner while parsing
    - Show error message if parse fails
  - Create `src/lib/components/DietAccordion.svelte`:
    - Render parsed data as collapsible accordion: DIETA 1 / DIETA 2 → ALMUERZO / COMIDA / MERIENDA / CENA → Options
    - Each diet section collapsible (click to expand/collapse)
    - Each meal section collapsible within diet
    - Show option names with ingredient list preview
    - Each ingredient line shows: quantity + name (or alternatives separated by " / ")
    - Use Tailwind: `bg-white dark:bg-gray-800`, `border`, `rounded-lg`, `p-4`, `cursor-pointer`
  - Update `src/App.svelte` to compose PdfUpload + DietAccordion
  - Wire up `invoke` from `@tauri-apps/api/core` for the parse_pdf command
  - For dev/testing without Tauri: add a mock mode that loads golden reference JSON directly

  **Must NOT do**:
  - Don't implement meal selection checkboxes (Task 11)
  - Don't add animations/transitions on accordion expand/collapse
  - Don't add drag-to-reorder (Task 14)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI components with drag-drop interaction, accordion layout, dark mode styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Drag-drop zone design, accordion pattern, responsive layout

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 11)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 1, 7

  **References**:

  **Pattern References**:
  - `src/lib/state.svelte.ts` — import and use `appState` for parsed data
  - `src/lib/types.ts` — TypeScript types for parsed data structure
  - `tests/fixtures/abril_golden.json` — mock data for development without Tauri

  **External References**:
  - Tauri v2 invoke: `import { invoke } from '@tauri-apps/api/core'`
  - Svelte 5 runes components: `let { prop } = $props()`

  **WHY Each Reference Matters**:
  - The state module is the single source of truth. Components must read from `appState` not local state.
  - The golden reference JSON doubles as mock data for UI development before sidecar is wired up.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: PDF drop zone renders and accepts files
    Tool: Playwright (via playwright skill)
    Preconditions: `npm run dev` running (Vite dev server, not Tauri)
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert drop zone visible: selector `.drop-zone` or `[data-testid="pdf-upload"]`
      3. Assert text contains "Arrastra" or "Seleccionar"
      4. Screenshot the initial state
    Expected Result: Drop zone visible with instructional text
    Failure Indicators: Component not rendered, missing text
    Evidence: .sisyphus/evidence/task-10-dropzone.png

  Scenario: Accordion renders mock parsed data
    Tool: Playwright
    Preconditions: Dev server with mock mode enabled
    Steps:
      1. Navigate to app, trigger mock data load
      2. Assert "DIETA 1" header visible
      3. Click "DIETA 1" to expand
      4. Assert "ALMUERZO" visible
      5. Click "ALMUERZO" to expand
      6. Assert ingredient text visible (e.g., "Barra de Pan")
      7. Screenshot expanded state
    Expected Result: Accordion shows diet → meal → option → ingredients hierarchy
    Failure Indicators: Data not rendered, accordion doesn't expand
    Evidence: .sisyphus/evidence/task-10-accordion.png
  ```

  **Commit**: YES (group 6)
  - Message: `feat(ui): PDF upload + diet accordion display`
  - Files: `src/lib/components/PdfUpload.svelte`, `src/lib/components/DietAccordion.svelte`, `src/App.svelte`
  - Pre-commit: Dev server renders without errors

- [ ] 11. UI — Week/Day Grid + Meal Selection + Alternative Radios

  **What to do**:
  - Create `src/lib/components/WeekGrid.svelte`:
    - Grid/calendar view showing 28 days (4 weeks × 7 days)
    - Each day shows: day number, assigned diet (D1/D2 alternating, auto-assigned)
    - Visual distinction between D1 and D2 (different background colors)
    - Days are clickable to select/deselect (toggle checkbox)
    - Selected days highlighted with checkmark
    - Week headers (Semana 1, 2, 3, 4)
    - Slider or input to adjust number of weeks (1-4)
  - Create `src/lib/components/MealSelector.svelte`:
    - For the selected day, show all meals (ALMUERZO, COMIDA, MERIENDA, CENA)
    - Each meal has radio buttons for options (if multiple options exist)
    - Below selected option: ingredient lines displayed
    - For ingredient lines with `is_alternatives: true`: render radio buttons for each alternative
    - User's alternative choice stored in `appState.weekConfig.days[n].meals[m].alternative_choices[lineIndex]`
    - Default: first alternative pre-selected
  - Create `src/lib/components/DayDetail.svelte`:
    - Clicked day in WeekGrid opens detail panel showing MealSelector for that day
    - Shows diet name and all 4 meal sections
  - Update state management: when user changes selections, `appState.weekConfig` updates reactively

  **Must NOT do**:
  - Don't implement per-day alternative choices (ONE choice per "/" line applies to ALL days)
  - Don't add drag-to-reorder days (Task 14)
  - Don't add animations/transitions
  - Don't implement calculate button (Task 13)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex interactive UI with grid layout, radio groups, nested state management
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Grid layout design, radio group patterns, interactive selection UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10)
  - **Blocks**: Tasks 12, 14
  - **Blocked By**: Tasks 1, 7

  **References**:

  **Pattern References**:
  - `src/lib/state.svelte.ts` — `appState.weekConfig` for day selections
  - `src/lib/types.ts` — `DaySelection`, `MealSelection`, `WeekConfig` types

  **WHY Each Reference Matters**:
  - The state module defines the selection data structure that the calculation engine expects. The UI must produce selections that match the `sample_selection.json` fixture format.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Week grid renders 28 days with alternating diets
    Tool: Playwright
    Preconditions: Dev server running with mock data
    Steps:
      1. Navigate to app with mock parsed data
      2. Assert week grid visible with 28 day cells
      3. Check day 1 shows "D1" or "DIETA 1" indicator
      4. Check day 2 shows "D2" or "DIETA 2" indicator
      5. Check day 3 shows "D1" (alternating)
      6. Screenshot the grid
    Expected Result: 28-day grid with alternating D1/D2 colors
    Failure Indicators: Wrong day count, no diet indicators, no alternation
    Evidence: .sisyphus/evidence/task-11-weekgrid.png

  Scenario: Meal selection with alternative radios
    Tool: Playwright
    Preconditions: Mock data loaded, day clicked
    Steps:
      1. Click day 1 in grid
      2. Assert meal sections visible: ALMUERZO, COMIDA, MERIENDA, CENA
      3. In COMIDA section, verify 2 option radio buttons (Opción 1, Opción 2)
      4. Select Opción 2
      5. Assert Opción 2 ingredients display
      6. In an ingredient line with alternatives (e.g., "Arroz / Pasta / Couscous"), verify radio buttons for alternatives
      7. Select "Pasta" alternative
      8. Screenshot
    Expected Result: Options selectable via radio, alternatives selectable per ingredient line
    Failure Indicators: Missing options, alternatives not interactive, state not updating
    Evidence: .sisyphus/evidence/task-11-meal-selection.png
  ```

  **Commit**: YES (group 6)
  - Message: `feat(ui): week/day grid + meal selection + alternative radios`
  - Files: `src/lib/components/WeekGrid.svelte`, `src/lib/components/MealSelector.svelte`, `src/lib/components/DayDetail.svelte`
  - Pre-commit: Dev server renders without errors

- [ ] 12. Full IPC Integration (Frontend ↔ Rust ↔ Sidecar ↔ Frontend)

  **What to do**:
  - Wire up `PdfUpload.svelte` to call `invoke('parse_pdf', { path: filePath })` on file drop
  - Handle Tauri file path resolution: use `@tauri-apps/api/path` to resolve dropped file path
  - Parse the JSON response from sidecar and store in `appState.parsedData`
  - Wire up "Calcular" button to:
    1. Serialize `appState.weekConfig` to JSON string
    2. Call `invoke('calculate_totals', { selectionJson, pdfPath: appState.pdfPath })`
    3. Parse response and store in `appState.shoppingList`
  - Wire up "Exportar CSV" button to:
    1. Open save-as dialog using `@tauri-apps/plugin-dialog` → `save({ filters: [{ name: 'CSV', extensions: ['csv'] }] })`
    2. Call `invoke('export_csv', { totalsJson: JSON.stringify(totals), outputPath })`
    3. Show success/error message
  - Add loading states: `appState.loading = true` during IPC calls
  - Add error handling: catch invoke errors, set `appState.error`
  - Test the FULL flow: drop PDF → parse → select meals → calculate → export CSV

  **Must NOT do**:
  - Don't add retry logic or queuing — simple call + error display
  - Don't add progress bars — just a loading spinner
  - Don't modify the Python sidecar — frontend adapts to existing output

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration work touching all layers (Svelte ↔ Tauri IPC ↔ Rust commands ↔ shell sidecar ↔ Python). Debugging chain is complex.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on many previous tasks)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Tasks 5, 6, 7, 8, 10, 11

  **References**:

  **Pattern References**:
  - `src/lib/state.svelte.ts` — appState for all shared state
  - `src-tauri/src/lib.rs` — the 3 Tauri commands from Task 6
  - `src/lib/components/PdfUpload.svelte` — wire invoke to existing drop handler

  **API/Type References**:
  - Tauri invoke: `import { invoke } from '@tauri-apps/api/core'`
  - Tauri dialog: `import { save } from '@tauri-apps/plugin-dialog'`
  - Parse result shape: `ParseResult` type from `src/lib/types.ts`

  **WHY Each Reference Matters**:
  - This task connects all previous work. The Tauri invoke signature must match the Rust command parameters exactly. The JSON shapes must match between Python output and TypeScript types.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: End-to-end flow — PDF to CSV
    Tool: Playwright (via playwright skill)
    Preconditions: `npm run tauri dev` running, ABRIL.pdf accessible
    Steps:
      1. Launch app
      2. Use file picker to select ABRIL.pdf (or simulate file path via invoke)
      3. Wait for parse to complete (loading spinner disappears)
      4. Assert parsed data displays in accordion (DIETA 1, DIETA 2)
      5. Navigate to week grid
      6. Select at least 3 days
      7. For each day, verify meal options are selectable
      8. Click "Calcular" button
      9. Wait for calculation to complete
      10. Assert shopping list displays with ingredient names and quantities
      11. Click "Exportar CSV"
      12. Verify CSV file is created
    Expected Result: Full flow completes without errors, CSV contains aggregated ingredients
    Failure Indicators: Any step fails, IPC error, empty shopping list
    Evidence: .sisyphus/evidence/task-12-e2e-flow.png

  Scenario: Error handling for IPC failures
    Tool: Playwright
    Preconditions: App running
    Steps:
      1. Try to parse a non-PDF file (or invalid path)
      2. Assert error message displays to user
      3. Assert app doesn't crash — user can retry
    Expected Result: Graceful error display, app remains functional
    Failure Indicators: App crash, unhandled promise rejection, blank screen
    Evidence: .sisyphus/evidence/task-12-error-handling.png
  ```

  **Commit**: YES (group 7)
  - Message: `feat(integration): full IPC wiring frontend ↔ sidecar`
  - Files: `src/lib/components/PdfUpload.svelte`, `src/App.svelte`, any new integration code
  - Pre-commit: `npm run tauri dev` — full flow works

- [ ] 13. UI — Shopping List Display + Export CSV Button

  **What to do**:
  - Create `src/lib/components/ShoppingList.svelte`:
    - Display aggregated shopping list from `appState.shoppingList`
    - Table layout: Ingrediente | Cantidad | Unidad
    - Sort alphabetically by ingredient name
    - For items with quantity: show `300g`, `2 unidades`
    - For items without quantity: show `5 días` or `variable`
    - Total item count at top: "23 ingredientes"
    - Visual grouping by unit type (optional: g items together, unidades together)
  - Create `src/lib/components/ExportButton.svelte`:
    - "Exportar CSV" button with download icon
    - On click: open save-as dialog, call export IPC command
    - Show success message after export: "CSV guardado en {path}"
    - Disabled state when no shopping list data
  - Create `src/lib/components/CalculateButton.svelte`:
    - "Calcular Lista de Compra" button
    - On click: serialize selections, call calculate IPC, populate shoppingList
    - Disabled when no PDF parsed or no days selected
    - Loading state while calculating
  - Integrate all into App.svelte layout

  **Must NOT do**:
  - Don't add print/PDF export — CSV only
  - Don't add ingredient editing in the shopping list
  - Don't add quantity rounding or unit conversion in display

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Table layout, button states, visual feedback — frontend component work
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 12 base integration)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 8, 9, 12

  **References**:

  **Pattern References**:
  - `src/lib/state.svelte.ts` — `appState.shoppingList`
  - `src/lib/types.ts` — `ShoppingItem` type

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Shopping list displays correctly
    Tool: Playwright
    Preconditions: App with calculated totals
    Steps:
      1. After calculating totals, assert shopping list table visible
      2. Assert at least 5 ingredient rows displayed
      3. Check first ingredient has name, quantity, and unit columns
      4. Assert total count shown (e.g., "23 ingredientes")
      5. Screenshot
    Expected Result: Shopping list table with all aggregated ingredients
    Failure Indicators: Empty table, missing columns, wrong count
    Evidence: .sisyphus/evidence/task-13-shopping-list.png

  Scenario: Export button creates CSV file
    Tool: Bash + Playwright
    Preconditions: Shopping list populated
    Steps:
      1. Click export button
      2. Verify CSV file exists at expected location
      3. Check CSV has BOM and correct header
    Expected Result: CSV file created with correct content
    Failure Indicators: No file, wrong format, missing BOM
    Evidence: .sisyphus/evidence/task-13-csv-export.txt
  ```

  **Commit**: YES (group 8)
  - Message: `feat(ui): shopping list display + export CSV button`
  - Files: `src/lib/components/ShoppingList.svelte`, `src/lib/components/ExportButton.svelte`, `src/lib/components/CalculateButton.svelte`
  - Pre-commit: Components render correctly

- [ ] 14. UI — Dark/Light Mode + Save/Load Config + Drag Reorder

  **What to do**:
  - **Dark/Light Mode**:
    - Create `src/lib/components/ThemeToggle.svelte` — sun/moon icon button
    - Toggle `document.documentElement.classList.toggle('dark')`
    - Persist preference in localStorage: `localStorage.getItem/setItem('darkMode')`
    - Initialize from localStorage on app load
    - Apply to all components via Tailwind `dark:` variants
  - **Save/Load Configuration**:
    - Create `src/lib/components/ConfigButtons.svelte` — "Guardar" and "Cargar" buttons
    - "Guardar": serialize `appState.weekConfig` + alternative choices to JSON, use Tauri dialog `save()` to pick path, write via Tauri fs plugin
    - "Cargar": use Tauri dialog `open()` to pick JSON file, read via fs plugin, deserialize and restore `appState.weekConfig`
    - JSON structure: `{ version: 1, pdfName: "ABRIL.pdf", weekConfig: {...}, alternativeChoices: {...} }`
  - **Drag Reorder Days**:
    - In WeekGrid, make day cells draggable using native HTML5 drag & drop API
    - `draggable="true"` on day cells
    - `ondragstart`, `ondragover`, `ondrop` handlers to reorder days in `appState.weekConfig.days`
    - Visual feedback during drag (opacity change on dragged element)
    - After reorder, diet assignments stay with the day (the day's diet moves with it)
  - Update App.svelte to include ThemeToggle in header area

  **Must NOT do**:
  - Don't add system-preference detection for dark mode — manual toggle only
  - Don't add CSS transitions/animations for mode switch
  - Don't add auto-save — manual save button only
  - Don't add save versioning or undo/redo
  - Don't use a drag library — native HTML5 drag API is sufficient for prototype

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI polish features — theme toggle, file dialogs, drag & drop interaction
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 11, 12

  **References**:

  **Pattern References**:
  - `src/lib/state.svelte.ts` — `appState.darkMode`, `appState.weekConfig`
  - `src/app.css` — dark mode variant already configured in Task 1

  **API/Type References**:
  - Tauri dialog: `import { save, open } from '@tauri-apps/plugin-dialog'`
  - Tauri fs: `import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dark mode toggle works
    Tool: Playwright
    Preconditions: App running
    Steps:
      1. Assert initial mode (light or dark based on localStorage)
      2. Click theme toggle button
      3. Assert `document.documentElement.classList.contains('dark')` changed
      4. Assert background color changed visually
      5. Reload page — assert preference persisted
      6. Screenshot both modes
    Expected Result: Theme toggles, persists across reload
    Failure Indicators: No visual change, preference not persisted
    Evidence: .sisyphus/evidence/task-14-dark-mode.png, .sisyphus/evidence/task-14-light-mode.png

  Scenario: Save and load configuration round-trip
    Tool: Bash + Playwright
    Preconditions: App with meal selections made
    Steps:
      1. Make some meal selections in the app
      2. Click "Guardar" — save to a temp JSON file
      3. Verify JSON file exists and is valid
      4. Refresh app (clear state)
      5. Click "Cargar" — load the saved JSON
      6. Verify selections are restored
    Expected Result: Selections round-trip through save/load
    Failure Indicators: File not created, selections not restored, JSON parse error
    Evidence: .sisyphus/evidence/task-14-config-roundtrip.txt

  Scenario: Drag reorder days
    Tool: Playwright
    Preconditions: Week grid visible with 28 days
    Steps:
      1. Identify day 1 and day 3 cells
      2. Drag day 3 to day 1 position
      3. Assert day order changed in the grid
      4. Assert diet assignments moved with the days
    Expected Result: Days reordered, diets follow their days
    Failure Indicators: Drag doesn't work, days don't move, diet assignments break
    Evidence: .sisyphus/evidence/task-14-drag-reorder.png
  ```

  **Commit**: YES (group 8)
  - Message: `feat(ui): dark/light mode + save/load config + drag reorder`
  - Files: `src/lib/components/ThemeToggle.svelte`, `src/lib/components/ConfigButtons.svelte`, `src/lib/components/WeekGrid.svelte` (updated)
  - Pre-commit: Dark mode toggle works in dev

- [ ] 15. PyInstaller Bundling + Sidecar Binary Placement

  **What to do**:
  - Create `src-tauri/python/diet_parser.spec` for PyInstaller:
    - `--onefile` mode
    - `console=False` (no terminal window)
    - Hidden imports: `pdfminer`, `pdfminer.high_level`, `pdfminer.pdfpage`, `pdfminer.pdfinterp`, `pdfminer.converter`, `PIL`, `PIL.Image`
    - Exclude: `tkinter`, `matplotlib` (reduce size)
    - Name: `diet_parser`
  - Build the sidecar: `pyinstaller diet_parser.spec`
  - Copy output to `src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu` (Linux)
  - Document Windows build command: copy to `diet_parser-x86_64-pc-windows-msvc.exe`
  - Test the compiled binary: `./src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu parse ABRIL.pdf`
  - Verify `npm run tauri build` succeeds with sidecar included
  - Document build instructions in a comment block at top of `diet_parser.spec`
  - Create `src-tauri/python/build_sidecar.sh` helper script

  **Must NOT do**:
  - Don't attempt Windows cross-compilation on Linux
  - Don't add UPX compression (can cause antivirus false positives)
  - Don't add auto-build hooks — manual build step

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: PyInstaller configuration + file placement. Well-documented steps.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Tasks 2, 6

  **References**:

  **Pattern References**:
  - `src-tauri/python/diet_parser.py` — the script to bundle
  - `src-tauri/binaries/` — sidecar placement directory
  - `src-tauri/tauri.conf.json` — `externalBin` config from Task 6

  **External References**:
  - PyInstaller docs: https://pyinstaller.org/en/stable/spec-files.html

  **WHY Each Reference Matters**:
  - The binary name MUST match the Tauri `externalBin` config + target triple. Wrong name = sidecar not found at runtime.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Compiled sidecar binary works
    Tool: Bash
    Preconditions: PyInstaller installed, diet_parser.py finalized
    Steps:
      1. Run: `pyinstaller src-tauri/python/diet_parser.spec`
      2. Copy binary to sidecar location
      3. Run: `./src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu parse ABRIL.pdf | python -m json.tool > /dev/null`
      4. Verify JSON output has 2 diets with correct structure
    Expected Result: Compiled binary produces same output as Python script
    Failure Indicators: Binary crashes, missing module errors, wrong output
    Evidence: .sisyphus/evidence/task-15-binary-test.txt

  Scenario: Tauri build includes sidecar
    Tool: Bash
    Preconditions: Sidecar binary in place
    Steps:
      1. Run: `npm run tauri build 2>&1 | tail -20`
      2. Check build output for sidecar bundling message
      3. Verify output bundle exists in `src-tauri/target/release/`
    Expected Result: Tauri build succeeds with sidecar included
    Failure Indicators: Build fails, sidecar not found in bundle
    Evidence: .sisyphus/evidence/task-15-tauri-build.txt
  ```

  **Commit**: YES (group 9)
  - Message: `feat(bundle): PyInstaller sidecar binary + build config`
  - Files: `src-tauri/python/diet_parser.spec`, `src-tauri/python/build_sidecar.sh`, `src-tauri/binaries/diet_parser-x86_64-unknown-linux-gnu`
  - Pre-commit: Binary runs and produces valid output

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run linter checks on Python and Svelte code. Review all files for: `any` type assertions, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify Svelte 5 runes only (no `$:`, no `writable`/`readable` stores).
  Output: `Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill for UI)
  Start from clean state. Test full flow: drop ABRIL.pdf → parse → select meals → calculate → export CSV. Verify CSV content matches expected totals. Test dark/light toggle. Test save/load config. Test edge cases: no PDF loaded, no meals selected. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual code. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance (no animations, no i18n, no fuzzy matching). Flag any unaccounted files or features.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| # | Message | Files | Pre-commit check |
|---|---------|-------|-----------------|
| 1 | `feat(scaffold): init Tauri v2 + Svelte 5 + TailwindCSS v4` | All scaffolded files | `npm run dev` launches |
| 2 | `feat(parser): raw text extraction + golden reference fixtures` | `diet_parser.py`, `tests/fixtures/*` | `python diet_parser.py parse ABRIL.pdf` outputs text |
| 3 | `feat(parser): structure + ingredient extraction with alternatives` | `diet_parser.py` | `diff tests/fixtures/abril_golden.json <(python diet_parser.py parse ABRIL.pdf)` = 0 |
| 4 | `feat(sidecar): Tauri v2 shell plugin + capabilities + IPC commands` | `src-tauri/*`, `package.json` | App builds with `npm run tauri build` |
| 5 | `feat(calc): calculation engine + CSV export` | `diet_parser.py` | `diff tests/fixtures/expected_totals.json <(python diet_parser.py calculate ...)` = 0 |
| 6 | `feat(ui): meal selection UI + week/day grid + accordion` | `src/*.svelte`, `src/lib/*` | Components render in dev mode |
| 7 | `feat(integration): full IPC wiring frontend ↔ sidecar` | `src/*.svelte`, `src-tauri/src/lib.rs` | End-to-end flow works |
| 8 | `feat(ui): shopping list + CSV export + dark mode + save/load` | `src/*.svelte` | All features functional |
| 9 | `feat(bundle): PyInstaller sidecar binary + build config` | `diet_parser.spec`, `src-tauri/binaries/*` | `npm run tauri build` produces working app |

---

## Success Criteria

### Verification Commands
```bash
# Parser outputs valid JSON matching golden reference
python src-tauri/python/diet_parser.py parse ABRIL.pdf | python -m json.tool > /dev/null

# Calculation produces aggregated totals
python src-tauri/python/diet_parser.py calculate tests/fixtures/sample_selection.json | python -m json.tool > /dev/null

# CSV export works
python src-tauri/python/diet_parser.py export tests/fixtures/expected_totals.json /tmp/test.csv && file /tmp/test.csv

# Tauri dev mode launches
npm run tauri dev

# Tauri build produces bundle
npm run tauri build
```

### Final Checklist
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] Golden reference diff = 0 for parser output
- [ ] CSV export contains correct aggregated quantities with UTF-8 BOM
- [ ] Dark/light mode persists across app restart
- [ ] Save/load config round-trips correctly
- [ ] App launches and completes full flow: PDF → parse → select → calculate → export
