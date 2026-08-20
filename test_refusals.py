import csv
from pathlib import Path
import config
from query import load_index, retrieve, generate_arabic_grounded_answer

CSV_PATH = Path(config.BASE_DIR) / "eval" / "Day3_Refusal_Test_Cases.csv"


def classify_expected(expected_text: str) -> str:
    """Returns 'refuse', 'partial', or 'answer' based on the CSV wording.
    Prints the raw text too so you can see exactly what's being matched."""
    e = expected_text.strip().lower()
    if "in-scope part" in e or "partial" in e:
        return "partial"
    if "refuse" in e or "decline" in e:
        return "refuse"
    if "cautio" in e:  # "cite cautiously"
        return "caution"
    if "answer" in e:
        return "answer"
    return "unknown"


def main():
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found.")
        return

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    vectordb = load_index()
    print(f"\n[Running Day 3 Adversarial Test Suite on {len(rows)} cases...]\n")

    pass_count = 0
    unknown_count = 0

    for i, row in enumerate(rows, 1):
        prompt_text = row.get("Prompt", "")
        expected_raw = row.get("Expected Behavior", "")
        expected_class = classify_expected(expected_raw)

        retrieved = retrieve(vectordb, prompt_text)
        top_distance = retrieved[0][1] if retrieved else 999.0
        refused, answer = generate_arabic_grounded_answer(prompt_text, retrieved, verbose=False)

        # verdict logic — no automatic PASS for any refusal anymore
        if expected_class == "refuse":
            status = "PASS" if refused else "FAIL"
        elif expected_class == "answer":
            status = "PASS" if not refused else "FAIL"
        elif expected_class in ("partial", "caution"):
            # ambiguous by nature — flag for manual review, don't force a verdict
            status = "REVIEW"
        else:
            status = "UNKNOWN-EXPECTED"
            unknown_count += 1

        if status == "PASS":
            pass_count += 1

        print(f"Test [{i}] Category: {row.get('Category', 'N/A')}")
        print(f"  Prompt          : {prompt_text}")
        print(f"  Expected (raw)  : '{expected_raw}'  -> classified as: {expected_class}")
        print(f"  Top distance    : {top_distance:.3f}  (threshold={config.__dict__.get('CONFIDENCE_THRESHOLD', 'n/a')})")
        print(f"  Refused         : {refused}")
        print(f"  Verdict         : [{status}]")
        
        # التعديل هنا: التعامل مع answer كـ dictionary واستخراج recommendation
        preview_text = answer.get("recommendation", "") if isinstance(answer, dict) else str(answer)
        print(f"  Answer preview  : {preview_text[:100]}")
        print("-" * 70)

    print(f"\n[Summary] PASS: {pass_count}/{len(rows)}  |  UNKNOWN-EXPECTED (fix CSV parsing): {unknown_count}")
    print("Note: 'REVIEW' cases (partial/caution) need manual judgment — a script can't grade nuance automatically.")


if __name__ == "__main__":
    main()