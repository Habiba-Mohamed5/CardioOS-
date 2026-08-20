# Day 1 RAG Starter Kit

A minimal, working LangChain + ChromaDB scaffold for the **AI Clinical
Decision Support Lite Hackathon**. Clone it, drop in a guideline PDF, and
you have a working ingestion + retrieval pipeline in minutes — so Day 1 is
about your RAG *design decisions*, not boilerplate setup.

## What's included

| File | Purpose |
|---|---|
| `config.py` | All tunable settings in one place (chunk size, embedding provider, top-k) |
| `ingest.py` | Loads PDFs from `data/`, chunks them, embeds them, builds a Chroma index |
| `query.py` | Retrieves the top-k chunks for a question and prints them with citations |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for optional API keys |

This is intentionally minimal — it's a **starting point**, not a finished
product. Your job on Day 1 is to improve on it: try a different chunking
strategy, compare embedding models, and get your metadata right.

## Setup

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Configure environment variables
cp .env.example .env
# Edit .env if you want to use OpenAI embeddings/generation.
# The default config runs 100% free and local — no API key required.
```

## Usage

The repo ships with a real, ready-to-use source already in `data/`:
**WHO_Hypertension_Guideline_2021.pdf** — the official WHO "Guideline for the
pharmacological treatment of hypertension in adults" (2021), full text,
CC BY-NC-SA 3.0 IGO.

```bash
# 1. (Optional) Add your own guideline PDF(s) to the data/ folder too
cp /path/to/your-guideline.pdf data/

# 2. Build the index (processes every PDF in data/, including the bundled one)
python ingest.py

# 3. Ask a question
python query.py "What is the recommended target blood pressure for adults with cardiovascular disease?"
```

`query.py` prints the top retrieved chunks with their similarity score and
full citation metadata (document name, page number, chunk id). If you've
set `OPENAI_API_KEY` in `.env`, it also prints a short grounded answer —
a preview of the work you'll formalize on Day 3.

## What's already handled for you

- **PDF parsing** with page-level metadata via `PyPDFLoader`
- **Chunking** with a recursive, paragraph-first splitter (`RecursiveCharacterTextSplitter`)
- **Citation-ready metadata** — every chunk carries `document_name`, `page_number`, and a stable `chunk_id`
- **Free-by-default embeddings** — runs locally via `fastembed` (lightweight, no PyTorch), no API key required
- **A persisted Chroma index** you can query repeatedly without re-embedding

## What you're expected to improve today

This starter uses a generic fixed-size-with-overlap split. Based on the
Day 1 curriculum, consider:

- Switching to a more **section-aware chunking** strategy for your specific
  document structure (see `chunk_documents()` in `ingest.py`)
- Comparing the default local embedding model against OpenAI or Cohere
  (see `get_embedding_function()` — swap `EMBEDDING_PROVIDER` in `.env`)
- Tuning `CHUNK_SIZE`, `CHUNK_OVERLAP`, and `TOP_K` in `config.py` and
  observing how retrieval quality changes

## Switching to OpenAI embeddings

Set in `.env`:
```
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
Then re-run `python ingest.py` to rebuild the index with OpenAI embeddings.

## Day 3: Structured output schema and refusal test cases

`schema/response_schema.json` is a real, validated JSON Schema (Draft-07)
defining the required output shape: `recommendation`, `evidence`, `citations`
(array of `{document, section, page}`), and `confidence`
(`high|medium|low|insufficient`). It includes a conditional rule — a
`high`/`medium`/`low` confidence answer *must* have non-empty evidence and
at least one citation; only an `insufficient` (refusal) response may leave
them empty. Validate your model's output against it with the `jsonschema`
Python package.

`eval/Day3_Refusal_Test_Cases.csv` is a ready-to-use bank of 10 prompts
across 5 categories (off-topic, personal medical advice, opinion requests,
prompt injection, mixed/edge cases) with expected behavior and reasoning for
each — use it to test your refusal logic, then extend with questions
specific to your chosen source.

## Day 2: Evaluation test set

`eval/Day2_Evaluation_Test_Set.csv` is a ready-to-use test set for measuring
retrieval quality — 8 questions with verified expected sources (document,
section, page) against the bundled WHO guideline, including one deliberate
out-of-scope question to test refusal. Columns: `Question`, `Expected Source`,
`Found in Top-k?`, `Precision@k`, `Notes`. Duplicate it, run each question
through your retriever, and fill in the last three columns to compute your
Day 2 Precision@k score. Add your own questions on top of the provided ones.

## Day 4: Starter benchmark, safety reference, and readiness gate

`eval/Day4_Starter_Benchmark.csv` is a ready-to-load benchmark: 10 retrieval
questions with verified page references against the bundled WHO guideline,
plus 2 safety/refusal cases. Add 5\u201310 of your own on top to keep the
evaluation-building objective intact.

`reference/Day4_Safety_Flowchart.pdf` is a one-page, printable safety
decision tree (input risk \u2192 retrieval threshold \u2192 claim validation) \u2014
pin it at your team's table during the lab.

`reference/Day4_Readiness_Scorecard.pdf` is a fillable, submittable
checklist with a trainer sign-off line. Completing and submitting it is a
mandatory gate before Day 5 judging, not an optional self-assessment.

## Round 2: LXD/L&D additions (pacing, evaluation rigor, presentation prep)

**Day 1**
- `reference/Day1_Module_Timer_Cards.pdf` \u2014 5 poster-style countdown cards, one per lab task, to prevent over-investing in source vetting at the expense of a working index.
- `reference/Day1_PreDay_Readiness_Checklist.pdf` \u2014 a gate completed before the lunch cutoff, requiring a confirmed source license and a functioning parser output.

**Day 2**
- `templates/Day2_Retrieval_Scorecard_Template.xlsx` \u2014 a working Excel scorecard with **live formulas**: mark each retrieved chunk 0/1 relevant and Precision@5 (and the team average) calculate automatically, with conditional formatting.
- `reference/Day2_Facilitator_SpotCheck_Protocol.pdf` \u2014 a mandatory protocol requiring a facilitator to personally verify at least one real query result per team before end of day.

**Day 3**
- `reference/Day3_CrossTeam_EdgeCase_Exchange.pdf` \u2014 a 15-minute structured exercise where teams swap adversarial questions to pressure-test each other's refusal logic.
- `reference/Day3_Refusal_Quality_Rubric.pdf` \u2014 a 3-point self-grading checklist (states insufficiency / stays honest / offers a next step) for every refusal case.

**Day 4**
- Already fully covered by the Round 1 additions below (Safety Flowchart, Starter Benchmark, Readiness Scorecard) \u2014 no further changes needed.

**Day 5**
- `reference/Day5_Judges_Persona_RolePlay.pdf` \u2014 a 20-minute script where team members role-play as each of the 7 judges to pressure-test their own pitch.
- `reference/Day5_Pitch_Cheatsheet.pdf` \u2014 a one-page reference to keep beside you during the demo.
- `reference/Day5_Demo_Backup_SOP.pdf` \u2014 the standard operating procedure for recording, naming, storing, and triggering a 60-second backup video.
- `reference/Day5_PostPitch_Reflection_Survey.pdf` \u2014 a 5-minute reflection survey completed immediately after presenting.
- `reference/Day5_Rubric_Mapped_Scorecard.pdf` \u2014 a judge-facing scorecard mapped directly to the 100-point rubric, with a score and note field per category.

## Troubleshooting

- **"No PDF files found in data/"** — add at least one `.pdf` file to the `data/` folder first.
- **First run is slow** — the local embedding model (~130MB) downloads once and is cached afterward.
- **Want to start over?** — delete the `chroma_db/` folder and re-run `ingest.py`.
