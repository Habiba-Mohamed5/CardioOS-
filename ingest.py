"""
CardioOS — Ingestion Pipeline (Day 1 baseline + clinical metadata layer)
--------------------------------------------------------------------------
Loads guideline PDFs for Hypertension, Type 2 Diabetes, and Heart Failure.
Uses the same chunking approach as the Day 1 starter (chunk size/overlap
come from config.py so ablation experiments in Day 2 stay comparable),
and enriches each chunk with clinical_domain + evidence_source metadata
so later features (Contradiction Detector, Evidence Card) can filter and
label sources correctly.

Usage:
    python ingest.py
"""
import sys
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

import config

# ---------------------------------------------------------------------------
# Explicit source registry — maps exact filenames (no extension) to their
# clinical metadata. This is deliberately explicit rather than substring
# guessing: an unrecognized file stops the pipeline instead of silently
# getting mislabeled as WHO/Hypertension, which would corrupt citations.
# Update this dict whenever you add or rename a PDF in data/.
# ---------------------------------------------------------------------------
SOURCE_REGISTRY = {
    "WHO_Hypertension_Guideline_2021": {
        "clinical_domain": "Hypertension",
        "evidence_source": "WHO (2021)",
    },
    "NICE_Hypertension_Guideline_2026": {
        "clinical_domain": "Hypertension",
        "evidence_source": "NICE (2026)",
    },
    "NICE_Type2_Diabetes_NG28": {
        "clinical_domain": "Type 2 Diabetes",
        "evidence_source": "NICE NG28",
    },
    "AHA_Heart_Failure_Guideline_2022": {
        "clinical_domain": "Heart Failure",
        "evidence_source": "AHA/ACC (2022)",
    },
}

def get_embedding_function():
    """Returns the embedding function based on config.EMBEDDING_PROVIDER."""
    if config.EMBEDDING_PROVIDER == "openai":
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(model=config.OPENAI_EMBEDDING_MODEL)
    else:
        from langchain_community.embeddings import FastEmbedEmbeddings
        return FastEmbedEmbeddings(model_name=config.LOCAL_EMBEDDING_MODEL)

def load_pdfs(data_dir: Path):
    """Loads every PDF in data_dir and returns one LangChain Document per
    page, tagged with document_name, page_number, and — via SOURCE_REGISTRY —
    clinical_domain and evidence_source. Fails loudly on any PDF that isn't
    registered, instead of guessing."""
    pdf_files = sorted(data_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {data_dir}/")
        print("Add your guideline PDFs there, then re-run this script.")
        sys.exit(1)

    unregistered = [p.stem for p in pdf_files if p.stem not in SOURCE_REGISTRY]
    if unregistered:
        print("\n[ERROR] The following PDFs are not in SOURCE_REGISTRY:")
        for name in unregistered:
            print(f"  - {name}.pdf")
        print("\nAdd an entry for each in SOURCE_REGISTRY at the top of this")
        print("file (clinical_domain + evidence_source), then re-run.")
        sys.exit(1)

    all_docs = []
    for pdf_path in pdf_files:
        tags = SOURCE_REGISTRY[pdf_path.stem]
        print(f"Loading {pdf_path.name}  [{tags['clinical_domain']} / {tags['evidence_source']}]")
        loader = PyPDFLoader(str(pdf_path))
        pages = loader.load()
        for page in pages:
            page.metadata["document_name"] = pdf_path.stem
            page.metadata["page_number"] = page.metadata.get("page", 0) + 1
            page.metadata["clinical_domain"] = tags["clinical_domain"]
            page.metadata["evidence_source"] = tags["evidence_source"]
        all_docs.extend(pages)
        print(f"  -> {len(pages)} pages loaded")
    return all_docs

def chunk_documents(documents):
    """Splits documents into overlapping chunks using config.py's values —
    unchanged from the Day 1 baseline, so Day 2's ablation experiment
    (comparing chunk sizes) stays a fair, apples-to-apples comparison.
    NOTE: this is still a recursive character splitter, not true
    section-aware chunking (it doesn't parse headings like "3.6 Target
    blood pressure" as boundaries) — don't call it that in the pitch."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE * 4,       # ~4 chars per token estimate
        chunk_overlap=config.CHUNK_OVERLAP * 4,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)

    for i, chunk in enumerate(chunks):
        doc_name = chunk.metadata.get("document_name", "unknown")
        page = chunk.metadata.get("page_number", "?")
        chunk.metadata["chunk_id"] = f"{doc_name}-p{page}-c{i}"

    return chunks

def build_index(chunks):
    """Embeds chunks and persists them into a local Chroma collection."""
    embedding_fn = get_embedding_function()

    print(f"\nEmbedding {len(chunks)} chunks using '{config.EMBEDDING_PROVIDER}' provider ...")
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_fn,
        collection_name=config.COLLECTION_NAME,
        persist_directory=str(config.CHROMA_DIR),
    )
    print(f"Done. Index saved to {config.CHROMA_DIR}/")
    return vectordb

def main():
    print("=== CardioOS Ingestion Pipeline ===\n")
    documents = load_pdfs(config.DATA_DIR)
    chunks = chunk_documents(documents)

    # Quick sanity check: how many chunks came from each guideline
    from collections import Counter
    counts = Counter(c.metadata["evidence_source"] for c in chunks)
    print(f"\nCreated {len(chunks)} chunks from {len(documents)} pages:")
    for source, n in counts.items():
        print(f"  {source}: {n} chunks")

    build_index(chunks)
    print('\nNext step: run  python query.py "your question here"  to test retrieval.')

if __name__ == "__main__":
    main()