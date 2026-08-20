import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# تحديد مسار الداتا
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

def test_custom_chunking():
    print("=== Testing Custom Chunking Strategy ===\n")
    
    # 1. تحميل الملفات من مجلد data
    pdf_files = sorted(DATA_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {DATA_DIR}/")
        return

    all_docs = []
    for pdf_path in pdf_files:
        print(f"Loading {pdf_path.name} ...")
        loader = PyPDFLoader(str(pdf_path))
        pages = loader.load()
        for page in pages:
            page.metadata["document_name"] = pdf_path.stem
            page.metadata["page_number"] = page.metadata.get("page", 0) + 1
        all_docs.extend(pages)

    # 2. تجربة تظبيط حجم القطع (Chunk Size & Overlap)
    # تقدري تغيري الأرقام دي هنا مباشرة وتجربي تأثيرها
    CUSTOM_CHUNK_SIZE = 350 * 4      # تحويل الـ tokens لـ characters تقريباً
    CUSTOM_CHUNK_OVERLAP = 70 * 4

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CUSTOM_CHUNK_SIZE,
        chunk_overlap=CUSTOM_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    
    chunks = splitter.split_documents(all_docs)

    # 3. طباعة عينة من النواتج للتأكد منها
    print(f"\nTotal Chunks Created: {len(chunks)}")
    print("\nSample Chunk Metadata & Preview:")
    for i in range(min(3, len(chunks))):
        chunk = chunks[i]
        print(f"\n--- Chunk [{i+1}] ---")
        print(f"Document: {chunk.metadata.get('document_name')}")
        print(f"Page: {chunk.metadata.get('page_number')}")
        print(f"Content Preview: {chunk.page_content.strip()[:150]}...")

if __name__ == "__main__":
    test_custom_chunking()