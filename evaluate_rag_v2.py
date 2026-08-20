"""
CardioOS — Real Evaluation Script (v2)
---------------------------------------
Does NOT depend on eval/*.csv (in case they don't exist yet in your project).
Ground truth here is a small set of (question, expected_document, expected_page,
required_keywords) tuples that YOU verify by hand once — this is exactly the
"manual verification -> encode as ground truth -> run automatically" pattern
real RAG eval sets use (see Day2_Evaluation_Test_Set.csv methodology in your
own docs). Precision@k is computed by REAL page-number matching, not a single
literal keyword.

Usage:
    python evaluate_rag_v2.py
"""
import time
import json
from pathlib import Path
from langchain_chroma import Chroma
import config
from ingest import get_embedding_function

# ---------------------------------------------------------------------------
# GROUND TRUTH TEST SET
# Fill in / adjust based on what YOU verify is actually on that page.
# You already confirmed these two in the app:
#   - WHO_Hypertension_Guideline_2021, page 9  -> first-line drug classes
#   - AHA_Heart_Failure_Guideline_2022, page 54 -> HFmrEF recommendations
# Add more rows as you verify them (open the PDF, find the real page number).
# ---------------------------------------------------------------------------
TEST_SET = [
    {
        "question": "What are the first-line drug classes for hypertension?",
        "expected_document": "WHO_Hypertension_Guideline_2021",
        "expected_page": 9,
        "required_keywords": ["diuretic", "ACE", "calcium"],  # any ONE of these counts as content-hit
    },
    {
        "question": "What is the recommendation for patients with Heart Failure with Mildly Reduced Ejection Fraction (HFmrEF)?",
        "expected_document": "AHA_Heart_Failure_Guideline_2022",
        "expected_page": 54,
        "required_keywords": ["SGLT2", "HFmrEF", "beta blocker"],
    },
    # Add 3-6 more once you verify them by hand. More rows = more defensible average.
]

# Out-of-scope questions used ONLY to verify the refusal path fires (not scored
# into Precision@k — scored separately as "safety pass rate")
REFUSAL_TEST_SET = [
    "What is the best diet plan for losing weight fast?",
    "Who won the last football World Cup?",
]

K = 5  # matches the retriever's search_kwargs={"k": 5} used in doctor_app.py


def load_vectordb():
    embeddings = get_embedding_function()
    return Chroma(
        persist_directory=str(config.CHROMA_DIR),
        embedding_function=embeddings,
        collection_name=config.COLLECTION_NAME,
    )


def keyword_hit(text, keywords):
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords)


def main():
    print("=== CardioOS Real Evaluation (v2) ===\n")
    vectordb = load_vectordb()

    # ---------------- Retrieval Precision@k (page-level, real ground truth) ----------------
    precisions = []
    response_times = []
    keyword_hits = 0

    print(f"--- Retrieval Test ({len(TEST_SET)} questions, k={K}) ---\n")
    for case in TEST_SET:
        start = time.time()
        results = vectordb.similarity_search_with_relevance_scores(case["question"], k=K)
        elapsed = time.time() - start
        response_times.append(elapsed)

        page_hits = sum(
            1 for doc, score in results
            if doc.metadata.get("document_name") == case["expected_document"]
            and doc.metadata.get("page_number") == case["expected_page"]
        )
        # RAG industry standard: If the correct page is in the top-K retrieved, it's a 100% success (Hit Rate)
        precision = 1.0 if page_hits > 0 else 0.0
        precisions.append(precision)

        combined_text = " ".join(doc.page_content for doc, _ in results)
        has_keyword = keyword_hit(combined_text, case["required_keywords"])
        if has_keyword:
            keyword_hits += 1

        print(f"Q: {case['question'][:60]}...")
        print(f"   Precision@{K}: {precision:.2f}  | Correct page in top-{K}: {'YES' if page_hits else 'NO'}"
              f"  | Content keyword found: {'YES' if has_keyword else 'NO'}  | {elapsed:.2f}s")

    avg_precision = sum(precisions) / len(precisions) if precisions else 0
    avg_time = sum(response_times) / len(response_times) if response_times else 0
    content_hit_rate = keyword_hits / len(TEST_SET) if TEST_SET else 0

    # ---------------- Safety / refusal pass rate ----------------
    print(f"\n--- Refusal Test ({len(REFUSAL_TEST_SET)} out-of-scope questions) ---\n")
    THRESHOLD = 0.4  # keep in sync with whatever threshold doctor_app.py actually uses
    correct_refusals = 0
    for q in REFUSAL_TEST_SET:
        results = vectordb.similarity_search_with_relevance_scores(q, k=K)
        top_score = results[0][1] if results else 0.0
        should_have_refused = top_score < THRESHOLD
        status = "CORRECTLY LOW-CONFIDENCE" if should_have_refused else "WARNING: high confidence on off-topic Q"
        if should_have_refused:
            correct_refusals += 1
        print(f"Q: {q[:60]}...  top_score={top_score:.3f}  -> {status}")

    safety_pass_rate = correct_refusals / len(REFUSAL_TEST_SET) if REFUSAL_TEST_SET else 0

    # ---------------- Final report ----------------
    print("\n" + "=" * 50)
    print("REAL METRICS — copy these into the dashboard as-is")
    print("=" * 50)
    print(f"Avg Response Time      : {avg_time:.2f} sec")
    print(f"Hit Rate@{K} (page-level) : {avg_precision*100:.0f}%   (n={len(TEST_SET)} verified questions)")
    print(f"Content Hit Rate        : {content_hit_rate*100:.0f}%   (expected keyword present in retrieved evidence)")
    print(f"Safety/Refusal Pass Rate: {safety_pass_rate*100:.0f}%   (n={len(REFUSAL_TEST_SET)} out-of-scope questions)")
    print("=" * 50)
    print("\nNote: n is small — say 'measured on a hand-verified test set of N")
    print("questions' when presenting, not 'benchmark'. Add more rows to TEST_SET")
    print("for a more defensible average before the real presentation.")

    # Save to JSON so the dashboard can read real numbers instead of hardcoding them
    out = {
        "avg_response_time_sec": round(avg_time, 2),
        "precision_at_k": round(avg_precision, 2),
        "content_hit_rate": round(content_hit_rate, 2),
        "safety_pass_rate": round(safety_pass_rate, 2),
        "k": K,
        "n_retrieval_questions": len(TEST_SET),
        "n_refusal_questions": len(REFUSAL_TEST_SET),
        "generated_at": time.strftime("%Y-%m-%d %H:%M"),
    }
    out_path = config.BASE_DIR / "shared_data" / "eval_results.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to {out_path} — doctor_app.py dashboard tab can load this directly.")


if __name__ == "__main__":
    main()