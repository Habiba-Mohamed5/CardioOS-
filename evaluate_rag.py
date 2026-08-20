import time
import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# تحميل الإعدادات
load_dotenv()
DB_DIR = Path("chroma_db")

print("🔄 Loading RAG System for Evaluation...")
embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
vectorstore = Chroma(persist_directory=str(DB_DIR), embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.0)

# اختبارات المعيارية (Benchmark Test Set)
# دي أسئلة هنسألها للسيستم، ونقارن هل الإجابة اللي هيطلعها فيها الكلمة المفتاحية الصح ولا لأ
test_cases = [
    {"query": "What are the first-line drug classes for hypertension?", "expected_keyword": "ACE"},
    {"query": "What is the recommended lifestyle modification to lower blood pressure?", "expected_keyword": "salt"},
    {"query": "What is hypertension?", "expected_keyword": "blood pressure"},
]

results = []
total_time = 0
hits = 0
faithful_responses = 0

print(f"\n🚀 Starting Evaluation on {len(test_cases)} questions...\n")

for i, test in enumerate(test_cases, 1):
    print(f"Testing Q{i}: {test['query']}")
    start_time = time.time()
    
    # 1. الاسترجاع (Retrieval)
    docs = retriever.invoke(test['query'])
    context_text = "\n".join([d.page_content for d in docs])
    
    # التحقق من الـ Hit Rate (هل الكلمة المطلوبة موجودة في المراجع اللي رجعت؟)
    if test['expected_keyword'].lower() in context_text.lower():
        hits += 1
        
    # 2. التوليد (Generation)
    system_prompt = "Answer based ONLY on context. Context: {context}"
    prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "{input}")])
    chain = prompt | llm | StrOutputParser()
    
    try:
        response = chain.invoke({"context": context_text, "input": test['query']})
        # التحقق من الـ Faithfulness (لو جاوب إجابة حقيقية مش "لا أعرف")
        if "insufficient evidence" not in response.lower() and test['expected_keyword'].lower() in response.lower():
            faithful_responses += 1
    except Exception as e:
        response = "Error"
        
    end_time = time.time()
    total_time += (end_time - start_time)
    print(f"   ↳ Done in {end_time - start_time:.2f} seconds.")

# حساب الأرقام النهائية
avg_time = total_time / len(test_cases)
hit_rate = (hits / len(test_cases)) * 100
faithfulness = (faithful_responses / len(test_cases)) * 100

print("\n" + "="*40)
print("🏆 YOUR REAL EVALUATION METRICS 🏆")
print("="*40)
print(f"⏱️ Avg Response Time : {avg_time:.2f} seconds")
print(f"🎯 Hit Rate @ 5      : {hit_rate:.0f}% (Retrieval Precision)")
print(f"🛡️ Faithfulness      : {faithfulness:.0f}% (Zero Hallucination check)")
print("="*40)