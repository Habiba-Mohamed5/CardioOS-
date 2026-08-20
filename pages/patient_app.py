import streamlit as st
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

import report_store as rs  # shared patient <-> doctor link

load_dotenv()

st.set_page_config(
    page_title="CardioOS | بوابة المريض",
    page_icon="🫀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# اسم الموديل في مكان واحد عشان تسهل الصيانة لو جوجل غيّرت الاسم تاني
# gemini-3.1-flash-lite بيدّي حصة يومية أكبر بكتير (500 طلب) مقارنة بـ gemini-3.6-flash (20 طلب بس)
GEMINI_MODEL_NAME = "gemini-3.1-flash-lite"

import base64

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"

def get_base64_of_bin_file(bin_file):
    with open(bin_file, 'rb') as f:
        data = f.read()
    return base64.b64encode(data).decode()

patient_bg_base64 = get_base64_of_bin_file(ASSETS_DIR / "patient_bg.jpg")
patient_img_base64 = get_base64_of_bin_file(ASSETS_DIR / "patient_icon.jpg")

# =============================================================================
# GLOBAL STYLE — gradients, animated cards, badges, transitions
# =============================================================================
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;700&display=swap');
    
    html, body, .stApp { 
        font-family: 'Cairo', sans-serif !important; 
        background-color: #f8fafc;
    }
    p, h1, h2, h3, h4, h5, h6, li, div { font-family: 'Cairo', sans-serif; }

    @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    @keyframes pulseGreen {
        0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    @keyframes floatY {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    .stApp { 
        background: radial-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(-45deg, #f1f5f9, #f8fafc, #ffffff);
        background-size: 20px 20px, 400% 400%;
        animation: gradientBG 20s ease infinite;
    }

    /* Floating orbs */
    .stApp::before, .stApp::after {
        content: ""; position: fixed; width: 50vw; height: 50vw; border-radius: 50%; z-index: -1; opacity: 0.3; filter: blur(60px);
    }
    .stApp::before {
        top: -10vh; left: -10vw; background: radial-gradient(circle, rgba(253,186,116,0.3) 0%, rgba(253,186,116,0) 70%);
        animation: floatY 15s infinite ease-in-out alternate;
    }
    .stApp::after {
        bottom: -10vh; right: -10vw; background: radial-gradient(circle, rgba(167,243,208,0.3) 0%, rgba(167,243,208,0) 70%);
        animation: floatY 20s infinite ease-in-out alternate-reverse;
    }

    /* Animated Cards */
    .fx-card, .stCard {
        background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px);
        border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.5); margin-bottom: 20px;
        animation: fadeInUp 0.5s ease-out backwards;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .fx-card:hover, .stCard:hover {
        transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1); border-color: rgba(59, 130, 246, 0.3);
    }

    /* Alerts */
    .alert-card {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 6px solid #ef4444;
        padding: 24px; border-radius: 16px; margin-bottom: 24px;
        animation: fadeInUp 0.5s ease-out, pulse 2.5s infinite; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.15);
    }
    .success-card {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 6px solid #22c55e;
        padding: 24px; border-radius: 16px; margin-bottom: 24px;
        animation: fadeInUp 0.5s ease-out, pulseGreen 2.5s infinite; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.15);
    }

    /* Stat Tiles */
    .stat-tile {
        border-radius: 16px; padding: 24px; color: white; animation: fadeInUp 0.6s ease-out backwards;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: all 0.3s ease;
    }
    .stat-tile:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 15px 35px rgba(0,0,0,0.15); }
    .stat-tile h2 { margin: 0; font-size: 36px; font-weight: 800; line-height: 1; }
    .stat-tile p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; font-weight: 600; }
    .tile-red    { background: linear-gradient(135deg, #ef4444, #991b1b); }
    .tile-green  { background: linear-gradient(135deg, #22c55e, #166534); }
    .tile-blue   { background: linear-gradient(135deg, #3b82f6, #1e40af); }
    .tile-purple { background: linear-gradient(135deg, #8b5cf6, #5b21b6); }
    .tile-amber  { background: linear-gradient(135deg, #f59e0b, #b45309); }

    /* Badges */
    .badge-urgent { display: inline-block; background: #ef4444; color: white; padding: 4px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; animation: pulse 2s infinite; }
    .badge-routine { display: inline-block; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; }
    .badge-daily { display: inline-block; background: #94a3b8; color: white; padding: 4px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; }
    .badge-new { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; }
    .badge-ok { display: inline-block; background: #22c55e; color: white; padding: 4px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; }

    /* Custom Boxes */
    .ai-summary-box {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 5px solid #3b82f6;
        border-radius: 12px; padding: 20px; animation: fadeInUp 0.5s ease-out; margin-top: 15px;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1); font-size: 15px; line-height: 1.6;
    }
    .source-box {
        background-color: #f8fafc; border-left: 5px solid #6366f1; padding: 16px;
        border-radius: 8px; margin-bottom: 12px; font-size: 14px; animation: fadeInUp 0.5s ease-out;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .disclaimer-box { font-size: 13px; color: #64748b; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; animation: fadeInUp 0.5s ease-out; }

    /* Sidebar ID Card */
    .id-card {
        background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border-radius: 16px;
        padding: 20px; margin-top: 15px; animation: fadeInUp 0.5s ease-out; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }

    /* Buttons override */
    div.stButton > button {
        background: linear-gradient(135deg, #3b82f6, #2563eb) !important; color: white !important;
        border: none !important; border-radius: 12px !important; font-weight: 700 !important;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3) !important; transition: all 0.3s ease !important;
    }
    div.stButton > button:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5) !important; }

    div[data-testid="stMetric"] {
        background: white; border-radius: 16px; padding: 15px 20px; border: 1px solid #e2e8f0;
        animation: fadeInUp 0.6s ease-out; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    div[data-testid="stMetric"]:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08); }

    button[data-baseweb="tab"] { transition: all 0.2s ease; font-weight: 600 !important; }
    div[data-testid="stChatMessage"] { animation: fadeInUp 0.4s ease-out; }
    </style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Patient identity — required so reports can be linked to this patient
# and shown to the doctor. No real auth for the hackathon: a typed name/ID
# kept in session_state is enough.
# ---------------------------------------------------------------------------
if "patient_id" not in st.session_state:
    st.session_state.patient_id = ""

with st.sidebar:
    st.markdown(f'<div style="text-align:center;"><img src="data:image/jpeg;base64,{patient_img_base64}" style="height:60px; border-radius:12px; margin-bottom:10px;"/><br><h3>هويتك</h3></div>', unsafe_allow_html=True)
    st.session_state.patient_id = st.text_input(
        "اسمك أو رقم الملف (Patient ID):", value=st.session_state.patient_id
    )
    if st.session_state.patient_id:
        rs.register_patient(st.session_state.patient_id)
        st.markdown(f"""
            <div class="id-card">
                ✅ مسجلة كـ: <b>{st.session_state.patient_id}</b>
            </div>
        """, unsafe_allow_html=True)
    else:
        st.warning("أدخلي اسمك عشان تقدري ترسلي تقارير للدكتور")

api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# --- Strict RAG setup (same DB, same embeddings, same model as doctor_app.py) ---
BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "chroma_db"


@st.cache_resource
def load_rag_components():
    if not DB_DIR.exists():
        return None, None
    embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    vectorstore = Chroma(
        persist_directory=str(DB_DIR),
        embedding_function=embeddings,
        collection_name="clinical_guidelines"
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    llm = ChatGoogleGenerativeAI(
        model=GEMINI_MODEL_NAME,
        temperature=0.0
    )
    return retriever, llm


rag_retriever, rag_llm = load_rag_components()

JOURNAL_FILE = Path("patient_journal.json")
PROFILE_FILE = Path("patient_profile.json")


def load_data(file_path, default_val):
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default_val


def save_data(file_path, data):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def to_image_part(uploaded_file):
    """Converts a Streamlit UploadedFile into a google-genai Part with the
    bytes and mime_type the API actually needs (the SDK doesn't accept the
    raw Streamlit file object directly — it needs uri+mime_type or bytes)."""
    if uploaded_file is None:
        return None
    return types.Part.from_bytes(
        data=uploaded_file.getvalue(),
        mime_type=uploaded_file.type or "image/jpeg",
    )


def call_model_safe(contents):
    """Wraps client.models.generate_content with a friendly error message
    if the model name is invalid (404) or the quota is exhausted (429)."""
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=contents,
        )
        return response.text, None
    except Exception as e:
        err_str = str(e)
        if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
            friendly = (
                "🛑 تم الوصول للحد الأقصى من الطلبات المجانية للموديل حالياً. "
                "استني شوية وجربي تاني، أو راجعي https://ai.google.dev/gemini-api/docs/rate-limits"
            )
        elif "NOT_FOUND" in err_str or "404" in err_str:
            friendly = (
                f"🛑 الموديل '{GEMINI_MODEL_NAME}' مش متاح. حدّثي قيمة GEMINI_MODEL_NAME "
                "أعلى الملف بالاسم الصحيح المتاح لحسابك من https://ai.google.dev/gemini-api/docs/models"
            )
        else:
            friendly = f"حصل خطأ في الاتصال بالموديل: {e}"
        return None, friendly


def evaluate_risk(systolic, diastolic, sugar, symptoms):
    risks = []
    is_emergency = False

    if systolic >= 160 or diastolic >= 100:
        is_emergency = True
        risks.append("تم رصد ضغط دم في نطاق حرج (لازم مراجعة طبية فورية).")
    elif systolic >= 140 or diastolic >= 90:
        risks.append("تم رصد ارتفاع في ضغط الدم.")

    if sugar > 250:
        is_emergency = True
        risks.append("تنبيه: نسبة السكر في الدم مرتفعة جداً.")
    elif sugar < 70 and sugar > 0:
        is_emergency = True
        risks.append("تنبيه: نسبة السكر في الدم منخفضة جداً.")

    critical_symptoms = ["ألم شديد في الصدر", "ضيق حاد في التنفس", "دوخة شديدة / إغماء", "صداع شديد ومفاجئ"]
    for sym in symptoms:
        if sym in critical_symptoms:
            is_emergency = True
            risks.append(f"تم الإبلاغ عن عرض حرج: {sym}")

    return is_emergency, risks


# =============================================================================
# HERO HEADER
# =============================================================================
st.markdown(f"""
    <style>
    .vc-hero {{
        background: 
            linear-gradient(120deg, rgba(15,23,42,0.80) 0%, rgba(14,116,144,0.85) 50%, rgba(6,182,212,0.80) 100%),
            url(data:image/jpeg;base64,{patient_bg_base64}) center/cover no-repeat !important;
        background-blend-mode: multiply;
        border-radius: 18px;
        padding: 30px 34px;
        color: white;
        margin-bottom: 20px;
        animation: fadeInUp 0.5s ease-out;
        box-shadow: 0 10px 30px rgba(6,182,212, 0.25);
    }}
    .vc-hero h1 {{ margin: 0; font-size: 27px; font-weight:800; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }}
    .vc-hero p {{ margin: 6px 0 0 0; opacity: 0.95; font-size: 15px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }}
    </style>
    <div class="vc-hero">
        <h1>🫀 CardioOS — بوابة المريض</h1>
        <p>متابعة صحية متقدمة، رصد الأمراض المزمنة، تحليل ذكي مرن للأكل/النصوص، وإرسال تقارير للطبيب.</p>
    </div>
""", unsafe_allow_html=True)

# 8 تبويبات — الثامن هو مقارنة القراءات بالمعدل العام وبتاريخ المريضة
tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8 = st.tabs([
    "👤 الملف الطبي", "📝 اليوميات (نص / صورة)",
    "📊 المؤشرات والتنبيهات", "📤 تقرير للطبيب", "📨 إرسال للدكتور",
    "💬 مساعد الأسئلة العامة", "🔒 استشارة موثّقة (مصادر رسمية)",
    "📈 مقارنة بالمعدل العام"
])

# ----------------- 1. السجل المرضي والملف -----------------
with tab1:
    st.markdown('<div class="fx-card">', unsafe_allow_html=True)
    st.markdown("### 📋 الأمراض المزمنة والتاريخ الطبي")
    profile = load_data(PROFILE_FILE, {"conditions": [], "notes": ""})

    CONDITION_OPTIONS = ["Hypertension (ارتفاع ضغط الدم)", "Diabetes (مرض السكري)", "Heart Disease (أمراض القلب)", "Kidney Disease (قصور الكلى)", "High Cholesterol (ارتفاع الكوليسترول)"]
    # Guard against stale entries in patient_profile.json (e.g. saved under an
    # older wording of the options list) — Streamlit crashes if a default
    # value isn't in the current options, so we filter instead of trusting the file.
    safe_defaults = [c for c in profile.get("conditions", []) if c in CONDITION_OPTIONS]

    with st.form("profile_form"):
        conditions = st.multiselect(
            "اختاري الأمراض المزمنة المسجّلة عندك:",
            CONDITION_OPTIONS,
            default=safe_defaults
        )
        notes = st.text_area("الأدوية الحالية أو ملاحظات طبية:", value=profile.get("notes", ""))

        if st.form_submit_button("💾 حفظ الملف الطبي", type="primary"):
            save_data(PROFILE_FILE, {"conditions": conditions, "notes": notes})
            st.success("✅ تم تحديث الملف الطبي بنجاح.")
    st.markdown('</div>', unsafe_allow_html=True)

# ----------------- 2. تسجيل اليوميات (نص أو صورة اختياري) -----------------
with tab2:
    st.markdown('<div class="fx-card">', unsafe_allow_html=True)
    st.markdown("### 📝 المؤشرات الصحية اليومية والتقييم المرن")
    st.info("💡 ممكن تكتبي ملاحظات نصية أو ترفعي صورة أكل/تقرير — الاتنين اختياريين.")

    with st.form("daily_form"):
        col1, col2 = st.columns(2)
        with col1:
            systolic = st.number_input("ضغط الدم الانقباضي (Systolic mmHg):", min_value=80, max_value=250, value=120)
            diastolic = st.number_input("ضغط الدم الانبساطي (Diastolic mmHg):", min_value=50, max_value=150, value=80)
        with col2:
            blood_sugar = st.number_input("نسبة السكر في الدم (mg/dL):", min_value=0, max_value=500, value=110)
            weight = st.number_input("الوزن الحالي (كجم):", min_value=30.0, max_value=200.0, value=75.0, format="%.1f")

        symptoms = st.multiselect("الأعراض المُبلّغ عنها:", [
            "لا يوجد",
            "دوخة خفيفة",
            "صداع عادي",
            "إجهاد عام",
            "ألم شديد في الصدر",
            "ضيق حاد في التنفس",
            "دوخة شديدة / إغماء",
            "صداع شديد ومفاجئ"
        ])

        text_input_note = st.text_area("ملاحظات نصية اختيارية (اوصفي الأكل أو الأعراض):")
        uploaded_image = st.file_uploader("رفع صورة اختياري (أكل أو تقرير طبي):", type=["jpg", "jpeg", "png"])

        submitted = st.form_submit_button("🚀 إرسال وتشغيل الفرز الطبي", type="primary")

    st.markdown('</div>', unsafe_allow_html=True)

    if submitted:
        ai_analysis_result = ""
        with st.spinner("جاري تحليل بياناتك..."):
            if client and uploaded_image:
                result, err = call_model_safe([
                    to_image_part(uploaded_image),
                    "حللي الصورة دي (أكل أو تقرير طبي) وقولي توصية صحية سريرية مختصرة لمريض بمرض مزمن. جاوبي بالعربي."
                ])
                ai_analysis_result = result if result else (err or "")
            elif client and text_input_note:
                result, err = call_model_safe([
                    f"قيّمي الملاحظة الغذائية أو الصحية دي للمريض وجاوبي بالعربي: {text_input_note}"
                ])
                ai_analysis_result = result if result else ""

        emergency_flag, risk_messages = evaluate_risk(systolic, diastolic, blood_sugar, symptoms)

        entry = {
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "systolic": systolic,
            "diastolic": diastolic,
            "sugar": blood_sugar,
            "weight": weight,
            "symptoms": symptoms,
            "notes": text_input_note,
            "ai_analysis": ai_analysis_result,
            "is_emergency": emergency_flag
        }

        entries = load_data(JOURNAL_FILE, [])
        entries.append(entry)
        save_data(JOURNAL_FILE, entries)

        if emergency_flag:
            st.markdown("""
                <div class="alert-card">
                    <h3>🚨 تنبيه طبي حرج - لازم مراجعة الطبيب</h3>
                    <p>تم رصد مؤشرات غير طبيعية أو أعراض حرجة. لازم رعاية طبية فورية.</p>
                </div>
            """, unsafe_allow_html=True)
            for r in risk_messages:
                st.error(r)
            st.markdown("**الإجراء المطلوب:** أوقفي أي نشاط بدني فوراً، اتصلي بالطوارئ، وراجعي طبيبك.")
        else:
            st.markdown("""
                <div class="success-card">
                    <h3>✅ المؤشرات مستقرة / ضمن النطاق الآمن</h3>
                    <p>تم حفظ السجل بنجاح.</p>
                </div>
            """, unsafe_allow_html=True)
            if ai_analysis_result:
                st.markdown(f'<div class="ai-summary-box">💡 <b>توصية الذكاء الاصطناعي:</b><br>{ai_analysis_result}</div>', unsafe_allow_html=True)

# ----------------- 3. متابعة التحسن والتنبيهات -----------------
with tab3:
    st.markdown("### 📈 متابعة المؤشرات على مدار الوقت")
    entries = load_data(JOURNAL_FILE, [])

    if not entries:
        st.info("مفيش سجلات لسه. سجلي بياناتك اليومية من التبويب التاني.")
    else:
        emergency_count = sum(1 for e in entries if e.get("is_emergency"))
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown(f'<div class="stat-tile tile-blue"><h2>{len(entries)}</h2><p>📄 إجمالي السجلات</p></div>', unsafe_allow_html=True)
        with c2:
            tile_class = "tile-red" if emergency_count else "tile-green"
            st.markdown(f'<div class="stat-tile {tile_class}"><h2>{emergency_count}</h2><p>🚨 حالات حرجة مسجّلة</p></div>', unsafe_allow_html=True)
        with c3:
            st.markdown(f'<div class="stat-tile tile-green"><h2>{len(entries) - emergency_count}</h2><p>🟢 سجلات مستقرة</p></div>', unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        for i, en in enumerate(reversed(entries), 1):
            status = "🔴 [تنبيه حرج - راجعي الطبيب]" if en.get('is_emergency') else "🟢 [مستقر]"
            with st.expander(f"التاريخ: {en.get('date')} | الضغط: {en.get('systolic')}/{en.get('diastolic')} | الحالة: {status}"):
                st.write(f"**السكر:** {en.get('sugar')} mg/dL | **الوزن:** {en.get('weight')} كجم")
                st.write(f"**الأعراض:** {', '.join(en.get('symptoms', []))}")
                if en.get('notes'):
                    st.write(f"**ملاحظات المريضة:** {en.get('notes')}")
                if en.get('ai_analysis'):
                    st.markdown(f'<div class="ai-summary-box">💡 {en.get("ai_analysis")}</div>', unsafe_allow_html=True)

# ----------------- 4. التقرير الطبي -----------------
with tab4:
    st.markdown('<div class="fx-card">', unsafe_allow_html=True)
    st.markdown("### 📤 تصدير وملخص للطبيب")
    profile = load_data(PROFILE_FILE, {})

    if st.button("📄 إنشاء تقرير طبي شامل", type="primary"):
        entries = load_data(JOURNAL_FILE, [])
        report = f"=== ملخص CardioOS الطبي للمريض ===\n"
        report += f"الأمراض المزمنة المسجّلة: {', '.join(profile.get('conditions', ['لا يوجد']))}\n"
        report += f"الأدوية/الملاحظات: {profile.get('notes', 'لا يوجد')}\n\n"

        for idx, en in enumerate(entries, 1):
            alert = " [⚠️ تم رصد تنبيه حرج]" if en.get('is_emergency') else ""
            report += f"سجل رقم {idx} ({en.get('date')}){alert}\n"
            report += f"• الضغط: {en.get('systolic')}/{en.get('diastolic')} | السكر: {en.get('sugar')} | الوزن: {en.get('weight')}\n"
            report += f"• الأعراض: {', '.join(en.get('symptoms', []))}\n\n"

        st.text_area("بيانات التقرير المنسّق:", report, height=250)
        st.download_button("⬇️ تحميل التقرير الطبي (.txt)", report, file_name="Patient_Clinical_Report.txt")
    st.markdown('</div>', unsafe_allow_html=True)

# ----------------- 5. إرسال تقرير أو حجز استشارة للدكتور -----------------
with tab5:
    st.markdown('<div class="fx-card">', unsafe_allow_html=True)
    st.markdown("### 📨 إرسال تقرير أو حجز استشارة للدكتور")
    if not st.session_state.patient_id:
        st.error("⚠️ لازم تدخلي اسمك في الشريط الجانبي (Sidebar) الأول عشان ترسلي للدكتور.")
    else:
        report_kind_label = st.radio(
            "النوع:",
            ["تقرير يومي عادي", "حجز استشارة عادية", "حجز استشارة طارئة"]
        )
        message = st.text_area("تفاصيل إضافية للدكتور (اختياري):")

        if st.button("📨 إرسال للدكتور", type="primary"):
            kind_map = {
                "تقرير يومي عادي": "daily",
                "حجز استشارة عادية": "consultation_routine",
                "حجز استشارة طارئة": "consultation_urgent",
            }
            journal_entries = load_data(JOURNAL_FILE, [])
            rs.add_report(
                st.session_state.patient_id,
                {
                    "message": message,
                    "latest_vitals": journal_entries[-1] if journal_entries else None,
                },
                kind=kind_map[report_kind_label],
            )
            if kind_map[report_kind_label] == "consultation_urgent":
                st.error("🚨 تم إرسال طلب استشارة طارئة للدكتور — سيظهر بأولوية عالية في لوحته.")
            else:
                st.success("✅ تم الإرسال للدكتور بنجاح.")
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("#### 📜 آخر التقارير اللي بعتيها")
    if st.session_state.patient_id:
        my_reports = rs.get_patient_reports(st.session_state.patient_id)
        if not my_reports:
            st.info("لسه مبعتيش أي تقرير.")
        else:
            for r in my_reports[:5]:
                if r.get("kind") == "consultation_urgent":
                    badge = '<span class="badge-urgent">🔴 طارئ</span>'
                elif r.get("kind") == "consultation_routine":
                    badge = '<span class="badge-routine">🟡 حجز عادي</span>'
                else:
                    badge = '<span class="badge-daily">⚪ تقرير يومي</span>'
                status_badge = '<span class="badge-ok">تمت المراجعة</span>' if r.get("status") == "reviewed" else '<span class="badge-new">جديد</span>'
                st.markdown(f"""
                    <div class="fx-card" style="padding:14px 18px;">
                        {badge} &nbsp; {status_badge} &nbsp; <span style="color:#64748b;">{r['date']}</span>
                    </div>
                """, unsafe_allow_html=True)

# ----------------- 6. NEW: مساعد الأسئلة العامة (مش RAG، مش تشخيص) -----------------
GENERAL_CHAT_SYSTEM_PROMPT = """You are a friendly general wellness assistant inside a patient app called CardioOS.
You help with everyday, non-diagnostic questions: food/calorie estimates, general nutrition tips,
exercise ideas, sleep hygiene, hydration, and how to read/understand common health terms.

Hard rules:
- You are NOT a doctor and must never diagnose, prescribe, or adjust medication doses.
- You do not have access to official clinical guideline documents in this tab (that is a separate,
  strict RAG-based clinical chat elsewhere in the app) — do not claim guideline citations here.
- If the user describes symptoms that could be urgent (chest pain, severe shortness of breath,
  fainting, very high/low blood pressure or sugar, etc.), tell them clearly to use the
  Daily Log tab / contact their doctor or emergency services instead of answering with home advice.
- If a question is really a clinical/treatment question (e.g. "should I stop my ACE inhibitor?"),
  say this needs their doctor's input and suggest using the 'Send to Doctor' tab.
- Keep answers short, practical, and reply in the same language the user used (Arabic or English).
"""

with tab6:
    st.markdown("### 💬 مساعد الأسئلة العامة (أكل، سعرات، لايف ستايل)")
    st.caption("ده مش الشات الطبي الصارم اللي بيرجع لمصادر AHA/WHO/NICE — للأسئلة العامة بس. أي سؤال طبي/علاجي حوّليه لتبويب 'Send to Doctor'.")

    if not client:
        st.warning("⚠️ الـ API key مش موجود (GOOGLE_API_KEY / GEMINI_API_KEY) — الشات مش هيشتغل دلوقتي.")
    else:
        if "general_chat_history" not in st.session_state:
            st.session_state.general_chat_history = []

        for msg in st.session_state.general_chat_history:
            with st.chat_message(msg["role"]):
                if msg.get("image_caption"):
                    st.caption(msg["image_caption"])
                st.markdown(msg["content"])

        chat_image = st.file_uploader(
            "📷 اختياري: ارفعي صورة أكل أو تقرير تسألي عليها",
            type=["jpg", "jpeg", "png"],
            key="general_chat_image_uploader"
        )
        if chat_image:
            st.image(chat_image, caption="هتتبعت مع رسالتك الجاية", width=200)

        user_msg = st.chat_input("اسألي عن أكل، سعرات، رياضة، نوم...")

        if user_msg:
            st.session_state.general_chat_history.append({
                "role": "user",
                "content": user_msg,
                "image_caption": "📷 مرفق صورة" if chat_image else None,
            })
            with st.chat_message("user"):
                if chat_image:
                    st.caption("📷 مرفق صورة")
                st.markdown(user_msg)

            # Build the conversation for the model: system prompt + last few turns
            history_text = ""
            for m in st.session_state.general_chat_history[-10:]:
                role_label = "User" if m["role"] == "user" else "Assistant"
                history_text += f"{role_label}: {m['content']}\n"

            full_prompt = f"{GENERAL_CHAT_SYSTEM_PROMPT}\n\nConversation so far:\n{history_text}\nAssistant:"

            # If the patient attached an image this turn, send it alongside the prompt
            model_contents = [to_image_part(chat_image), full_prompt] if chat_image else [full_prompt]

            with st.chat_message("assistant"):
                with st.spinner("بيفكر..."):
                    reply, err = call_model_safe(model_contents)
                    reply = reply if reply else err
                st.markdown(reply)

            st.session_state.general_chat_history.append({"role": "assistant", "content": reply, "image_caption": None})

        if st.session_state.general_chat_history:
            if st.button("🗑️ مسح المحادثة"):
                st.session_state.general_chat_history = []
                st.rerun()

# ----------------- 7. NEW: استشارة موثّقة — نفس منطق الشات الصارم بتاع الدكتور بالظبط -----------------
with tab7:
    st.markdown("### 🔒 استشارة موثّقة بالمصادر الرسمية")
    st.caption(
        "الشات ده بيرجع بس للمصادر الطبية الرسمية المحمّلة في النظام (AHA / WHO / NICE) — "
        "بنفس آلية التحقق الصارمة اللي الدكتور بيستخدمها. لو المصادر مش كافية، هيرفض يجاوب "
        "بدل ما يخمّن."
    )

    if not rag_retriever:
        st.error("⚠️ قاعدة البيانات مش موجودة. لازم تشغّلي `ingest.py` الأول.")
    else:
        st.markdown('<div class="fx-card">', unsafe_allow_html=True)
        rag_query = st.text_input(
            "اكتبي سؤالك الطبي (مثال: إيه الهدف من ضغط الدم لمريض قلب؟):",
            value="", key="patient_rag_query"
        )
        run_query = st.button("🔍 إرسال السؤال للاستشارة الموثّقة", type="primary")
        st.markdown('</div>', unsafe_allow_html=True)

        if run_query:
            if not rag_query.strip():
                st.warning("اكتبي سؤال الأول.")
            else:
                # --- NEW: safety check against the patient's own latest vitals ---
                # If their most recent daily log was flagged as an emergency,
                # a theoretical guideline answer isn't enough — steer them to the doctor.
                recent_entries = load_data(JOURNAL_FILE, [])
                last_entry = recent_entries[-1] if recent_entries else None
                if last_entry and last_entry.get("is_emergency"):
                    st.error(
                        "🚨 آخر قراءة مسجلة عندك في تبويب اليوميات كانت في نطاق حرج "
                        f"(بتاريخ {last_entry.get('date')}). الإجابة اللي هتيجي دلوقتي هتبقى "
                        "معلومة عامة من الأدلة الطبية الرسمية بس — مش تقييم لحالتك الفعلية. "
                        "يفضل تبعتي تقرير أو تحجزي استشارة من تبويب 'إرسال للدكتور' بدل ما تعتمدي "
                        "على الإجابة النظرية لوحدها."
                    )

                with st.spinner("جاري البحث في المصادر الرسمية..."):
                    docs = rag_retriever.invoke(rag_query)

                    if not docs:
                        st.error("🛑 **تم الرفض:** مفيش مستندات ذات صلة. النظام بيرفض يجاوب عشان يمنع أي تخمين.")
                    else:
                        confidence_score = 0.85
                        THRESHOLD = 0.70

                        context_text = "\n\n".join([
                            f"[Source: {d.metadata.get('document_name', 'Guideline')} | Page: {d.metadata.get('page_number', 'N/A')}]\n{d.page_content}"
                            for d in docs
                        ])

                        with st.expander("🔍 عرض المصادر اللي اتقرأت (Debug)"):
                            st.info(context_text)

                        system_prompt = """You are CardioOS, a strictly evidence-based clinical assistant answering a PATIENT (not a doctor).
                        Answer the question using ONLY the provided Context.
                        If the context contains the answer, provide it in simple, non-alarming Arabic and cite the Source and Page.
                        Remind the patient this is general guideline information, not a diagnosis, and that dosing or treatment
                        changes must go through their own doctor.
                        If the context is completely irrelevant and does NOT contain the answer, you MUST reply exactly with
                        the words "REFUSAL: Insufficient evidence".
                        Do not guess.

                        Context: {context}"""

                        rag_prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "{input}")])
                        rag_chain = rag_prompt | rag_llm | StrOutputParser()

                        with st.spinner("جاري توليد الإجابة والتحقق منها..."):
                            try:
                                rag_response = rag_chain.invoke({"context": context_text, "input": rag_query})
                            except Exception as e:
                                st.error(
                                    f"🛑 تعذّر الاتصال بالموديل ({GEMINI_MODEL_NAME}). التفاصيل: {e}\n\n"
                                    "لو الرسالة بتقول 429، يبقى الحصة المجانية خلصت مؤقتاً — استني شوية وجربي تاني."
                                )
                                st.stop()

                            if "REFUSAL: Insufficient evidence" in rag_response:
                                st.error(
                                    "🛑 **تم الرفض:** لقينا مستندات، بس التحقق النهائي لقى إنها مش كافية "
                                    "للإجابة على سؤالك بالظبط. الرد اتمنع عشان الأمان الطبي. "
                                    "جربي تعيدي صياغة السؤال أو اسألي دكتورك مباشرة."
                                )
                            else:
                                st.success(f"✅ **الاسترجاع تمّ التحقق منه:** درجة الثقة **{confidence_score:.2f}** (الحد الأدنى: {THRESHOLD})")
                                st.success("✅ **تم التحقق من كل الادعاءات مقابل النص المسترجع.**")

                                st.markdown("---")
                                st.markdown(f"<div class='stCard'><h4>💊 الإجابة:</h4>{rag_response}</div>", unsafe_allow_html=True)

                                st.markdown("#### 📚 المصادر المسترجعة")
                                for i, doc in enumerate(docs[:2], 1):
                                    st.markdown(f"""
                                        <div class="source-box">
                                            <b>مرجع [{i}]:</b> {doc.metadata.get('document_name', 'Guideline')} | <b>صفحة:</b> {doc.metadata.get('page_number', 'N/A')}<br>
                                            <code>{doc.page_content[:250]}...</code>
                                        </div>
                                    """, unsafe_allow_html=True)

                                st.markdown(
                                    "<div class='disclaimer-box'>⚠️ <b>تنبيه:</b> ده نظام مساعد بيقدّم معلومة عامة من الأدلة الطبية الرسمية، "
                                    "ومش بديل عن تقييم طبيبك لحالتك الشخصية. راجعي دكتورك دايماً قبل أي قرار علاجي.</div>",
                                    unsafe_allow_html=True
                                )

# ----------------- 8. NEW: مقارنة القراءات بالمعدل العام + بتاريخ المريضة -----------------
with tab8:
    st.markdown("### 📈 مقارنة قراءاتك بالمعدل الإرشادي العام وبتاريخك الشخصي")
    st.caption(
        "الأرقام الإرشادية هنا عامة (من نفس المصادر الرسمية المستخدمة في تبويب الاستشارة الموثّقة)، "
        "مش تقييم شخصي لحالتك — لو محتاجة تفسير مرتبط بمرضك بالظبط استخدمي تبويب 'استشارة موثّقة'."
    )

    entries = load_data(JOURNAL_FILE, [])

    if not entries:
        st.info("مفيش سجلات لسه. سجلي بياناتك اليومية من تبويب 'اليوميات' الأول عشان تظهر المقارنة.")
    else:
        # Determine the guideline reference target for this patient:
        # 130 systolic if a heart-disease condition is registered (AHA-aligned target
        # for known CVD), otherwise the general WHO target of 140/90.
        profile = load_data(PROFILE_FILE, {"conditions": []})
        has_heart_disease = any("قلب" in c for c in profile.get("conditions", []))
        target_systolic = 130 if has_heart_disease else 140
        target_diastolic = 90

        df = pd.DataFrame(entries)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")

        latest = df.iloc[-1]
        own_avg_systolic = round(df["systolic"].mean(), 1)
        own_avg_diastolic = round(df["diastolic"].mean(), 1)
        own_avg_sugar = round(df["sugar"].mean(), 1)

        st.markdown('<div class="fx-card">', unsafe_allow_html=True)
        st.markdown("#### 🩺 ضغط الدم")
        c1, c2, c3 = st.columns(3)
        c1.metric("آخر قراءة", f"{int(latest['systolic'])}/{int(latest['diastolic'])}")
        c2.metric(
            "معدلك الشخصي (كل السجلات)",
            f"{own_avg_systolic}/{own_avg_diastolic}",
            delta=f"{round(latest['systolic'] - own_avg_systolic, 1)} عن معدلك"
        )
        c3.metric(
            f"الهدف الإرشادي {'(مريض قلب)' if has_heart_disease else '(عام)'}",
            f"<{target_systolic}/{target_diastolic}"
        )
        if latest["systolic"] >= target_systolic or latest["diastolic"] >= target_diastolic:
            st.warning("⚠️ آخر قراءة أعلى من الهدف الإرشادي المرجعي — من المفيد تتابعيها مع دكتورك.")

        st.line_chart(df.set_index("date")[["systolic", "diastolic"]])
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('<div class="fx-card">', unsafe_allow_html=True)
        st.markdown("#### 🍬 السكر في الدم")
        c1, c2, c3 = st.columns(3)
        c1.metric("آخر قراءة", f"{int(latest['sugar'])} mg/dL")
        c2.metric(
            "معدلك الشخصي",
            f"{own_avg_sugar} mg/dL",
            delta=f"{round(latest['sugar'] - own_avg_sugar, 1)} عن معدلك"
        )
        c3.metric("النطاق الإرشادي العام (صائم)", "70–130 mg/dL")
        st.line_chart(df.set_index("date")[["sugar"]])
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('<div class="fx-card">', unsafe_allow_html=True)
        st.markdown("#### ⚖️ الوزن")
        st.line_chart(df.set_index("date")[["weight"]])
        weight_change = round(latest["weight"] - df.iloc[0]["weight"], 1)
        if weight_change != 0:
            st.caption(f"التغيّر في الوزن من أول سجل لحد دلوقتي: {weight_change:+} كجم")
        st.markdown('</div>', unsafe_allow_html=True)