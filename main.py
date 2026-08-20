import streamlit as st
from pathlib import Path
import base64

st.set_page_config(
    page_title="CardioOS | Health Ecosystem",
    page_icon="🫀",
    layout="wide",
    initial_sidebar_state="collapsed",
)

BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"

def get_base64_of_bin_file(bin_file):
    try:
        with open(bin_file, 'rb') as f:
            return base64.b64encode(f.read()).decode()
    except:
        return ""

hero_bg_base64 = get_base64_of_bin_file(ASSETS_DIR / "hero_bg.jpg")

# =============================================================================
# ULTRA-PROFESSIONAL GLOBAL STYLE
# =============================================================================
st.markdown(f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;700&display=swap');

    /* Global Typography & Hide Defaults */
    html, body, .stApp {{ 
        font-family: 'Cairo', sans-serif !important; 
        background: #0f172a;
        color: #f8fafc;
        direction: rtl;
        overflow-x: hidden;
    }}
    #MainMenu, header, footer {{ visibility: hidden; }}
    .stApp > header {{ background-color: transparent !important; }}

    /* Animations */
    @keyframes fadeInUp {{
        0% {{ opacity: 0; transform: translateY(30px); }}
        100% {{ opacity: 1; transform: translateY(0); }}
    }}
    @keyframes fadeIn {{
        0% {{ opacity: 0; }}
        100% {{ opacity: 1; }}
    }}
    @keyframes float {{
        0%, 100% {{ transform: translateY(0px) rotate(0deg); }}
        50% {{ transform: translateY(-15px) rotate(2deg); }}
    }}
    @keyframes pulse-glow {{
        0% {{ box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }}
        70% {{ box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }}
        100% {{ box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }}
    }}
    @keyframes backgroundPan {{
        0% {{ background-position: 0% 50%; }}
        50% {{ background-position: 100% 50%; }}
        100% {{ background-position: 0% 50%; }}
    }}

    /* Ambient Background Elements */
    .ambient-glow-1 {{
        position: fixed; top: -10%; left: -10%; width: 50vw; height: 50vw;
        background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(15,23,42,0) 70%);
        border-radius: 50%; z-index: -1; animation: float 12s ease-in-out infinite alternate;
    }}
    .ambient-glow-2 {{
        position: fixed; bottom: -10%; right: -10%; width: 50vw; height: 50vw;
        background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(15,23,42,0) 70%);
        border-radius: 50%; z-index: -1; animation: float 18s ease-in-out infinite alternate-reverse;
    }}

    /* Navbar */
    .custom-navbar {{
        position: fixed; top: 0; left: 0; right: 0;
        background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);
        padding: 15px 40px; display: flex; justify-content: space-between; align-items: center;
        z-index: 1000; border-bottom: 1px solid rgba(255,255,255,0.05);
        animation: fadeIn 1s ease-out;
    }}
    .custom-navbar .logo {{ font-size: 24px; font-weight: 800; background: linear-gradient(90deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
    .custom-navbar .nav-links {{ display: flex; gap: 20px; }}
    .custom-navbar .nav-links a {{ color: #cbd5e1; text-decoration: none; font-weight: 600; font-size: 15px; transition: color 0.3s; }}
    .custom-navbar .nav-links a:hover {{ color: #ffffff; }}

    /* Hero Section */
    .hero-container {{
        position: relative;
        margin-top: 80px; padding: 100px 20px;
        text-align: center;
        overflow: hidden;
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,58,138,0.7)), url(data:image/jpeg;base64,{hero_bg_base64}) center/cover;
        background-size: 200% 200%, cover;
        background-blend-mode: overlay;
        animation: backgroundPan 15s ease infinite;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }}
    .hero-content {{
        position: relative; z-index: 2; animation: fadeInUp 1s ease-out;
    }}
    .hero-badge {{
        display: inline-block; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5);
        color: #60a5fa; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 700;
        margin-bottom: 20px; backdrop-filter: blur(4px);
    }}
    .hero-title {{
        font-size: 56px; font-weight: 800; line-height: 1.2; margin-bottom: 20px;
        background: linear-gradient(to right, #ffffff, #93c5fd);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }}
    .hero-subtitle {{
        font-size: 20px; color: #94a3b8; max-width: 700px; margin: 0 auto 40px auto; line-height: 1.6;
    }}
    .hero-buttons {{
        display: flex; gap: 16px; justify-content: center;
    }}

    /* Video Section */
    .video-section {{
        margin: 60px 0; padding: 40px; background: rgba(30, 41, 59, 0.5); border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.05); text-align: center; animation: fadeInUp 1.2s ease-out;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }}
    .video-container {{
        position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; margin-top: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
    }}
    .video-container iframe {{
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    }}

    /* Feature Cards */
    .feature-grid {{
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin: 60px 0;
    }}
    .feature-card {{
        background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px);
        padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);
        text-align: center; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: fadeInUp 1.4s ease-out;
    }}
    .feature-card:hover {{
        transform: translateY(-10px); background: rgba(30, 41, 59, 0.9);
        border-color: rgba(96, 165, 250, 0.5); box-shadow: 0 15px 30px rgba(0,0,0,0.4);
    }}
    .feature-icon {{
        width: 60px; height: 60px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 16px; font-size: 24px; color: white;
    }}

    /* Portal Cards */
    .portal-container {{
        display: flex; gap: 30px; margin: 60px 0;
    }}
    .portal-card {{
        flex: 1; padding: 40px; border-radius: 24px; text-align: right; position: relative; overflow: hidden;
        transition: all 0.4s ease; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
        animation: fadeInUp 1.6s ease-out;
    }}
    .portal-doctor {{
        background: linear-gradient(135deg, rgba(30, 58, 138, 0.8), rgba(15, 23, 42, 0.9));
        box-shadow: 0 20px 40px rgba(30, 58, 138, 0.2);
    }}
    .portal-patient {{
        background: linear-gradient(135deg, rgba(127, 29, 29, 0.8), rgba(15, 23, 42, 0.9));
        box-shadow: 0 20px 40px rgba(127, 29, 29, 0.2);
    }}
    .portal-card:hover {{ transform: scale(1.02); }}
    .portal-card h2 {{ font-size: 32px; font-weight: 800; margin-bottom: 15px; color: white; }}
    .portal-card p {{ font-size: 16px; color: #cbd5e1; line-height: 1.7; margin-bottom: 30px; }}
    .portal-icon-large {{ font-size: 80px; position: absolute; left: -10px; bottom: -20px; opacity: 0.1; }}

    /* Buttons override */
    div.stButton > button {{
        background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
        color: white !important; border: none !important; border-radius: 12px !important;
        padding: 12px 24px !important; font-size: 16px !important; font-weight: 700 !important;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4) !important; transition: all 0.3s ease !important;
        height: auto !important; width: 100% !important;
    }}
    div.stButton > button:hover {{
        transform: translateY(-3px) !important; box-shadow: 0 8px 25px rgba(37, 99, 235, 0.6) !important;
    }}

    /* Hide horizontal scroll */
    .stMainBlockContainer {{ padding-top: 0 !important; max-width: 1200px !important; margin: 0 auto !important; }}
    
    </style>

    <div class="ambient-glow-1"></div>
    <div class="ambient-glow-2"></div>

    <nav class="custom-navbar">
        <div class="logo">CardioOS</div>
        <div class="nav-links">
            <a href="#features">المميزات</a>
            <a href="#demo">العرض التوضيحي</a>
            <a href="#portals">البوابات</a>
        </div>
    </nav>
""", unsafe_allow_html=True)

# Hero Section
st.markdown("""
    <div class="hero-container">
        <div class="hero-content">
            <div class="hero-badge">🚀 النظام متاح وجاهز للاستخدام الفوري</div>
            <h1 class="hero-title">مستقبل الرعاية الصحية بين يديك</h1>
            <p class="hero-subtitle">
                منظومة CardioOS المتكاملة توفر لك أدق التحليلات السريرية المدعومة بالذكاء الاصطناعي والأدلة الطبية الرسمية (WHO, AHA, NICE)، لتتخذ القرارات الصحيحة في الوقت المناسب.
            </p>
        </div>
    </div>
""", unsafe_allow_html=True)

st.markdown("<div id='demo'></div>", unsafe_allow_html=True)

# High-Quality Video Section (Embedded YouTube Video showing AI/Medical Tech)
st.markdown("""
    <div class="video-section">
        <h2 style="font-weight: 800; font-size: 32px; margin-bottom: 10px; color: white;">شاهد قوة النظام في العمل</h2>
        <p style="color: #94a3b8; font-size: 18px; margin-bottom: 20px;">تجربة تفاعلية سلسة تجمع بين دقة البيانات وسرعة الأداء</p>
        <div class="video-container">
            <!-- Professional medical AI loop video from Youtube (no controls, autoplay loop) -->
            <iframe src="https://www.youtube.com/embed/VzX3N6E1XQc?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&playlist=VzX3N6E1XQc" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
    </div>
""", unsafe_allow_html=True)

st.markdown("<div id='features'></div>", unsafe_allow_html=True)

# Animated Feature Grid
st.markdown("""
    <div class="feature-grid">
        <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3 style="color:white; font-size:20px; font-weight:700;">سرعة فائقة</h3>
            <p style="color:#94a3b8; font-size:14px; margin-top:10px;">استجابة فورية في أقل من 3 ثوانٍ لتحليل أصعب الحالات.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h3 style="color:white; font-size:20px; font-weight:700;">أمان تام</h3>
            <p style="color:#94a3b8; font-size:14px; margin-top:10px;">تشفير قوي وتطابق مع معايير الأمان العالمية لحماية بيانات المرضى.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3 style="color:white; font-size:20px; font-weight:700;">أدلة طبية</h3>
            <p style="color:#94a3b8; font-size:14px; margin-top:10px;">مبني على أحدث الإرشادات من منظمة الصحة العالمية وجمعية القلب.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3 style="color:white; font-size:20px; font-weight:700;">ذكاء اصطناعي</h3>
            <p style="color:#94a3b8; font-size:14px; margin-top:10px;">مستشار ذكي بدون هلوسة بفضل حواجز الأمان الصارمة.</p>
        </div>
    </div>
""", unsafe_allow_html=True)

st.markdown("<div id='portals'></div>", unsafe_allow_html=True)

# Professional Portals Section
st.markdown("""
    <h2 style="text-align: center; font-weight: 800; font-size: 36px; margin: 40px 0 20px 0; color: white;">بوابات الوصول</h2>
    <p style="text-align: center; color: #94a3b8; font-size: 18px; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto;">
        اختر البوابة المناسبة لك للبدء في استخدام منصة CardioOS المتطورة
    </p>
""", unsafe_allow_html=True)

c1, c2 = st.columns(2, gap="large")

with c1:
    st.markdown("""
        <div class="portal-card portal-doctor">
            <div class="portal-icon-large">👨‍⚕️</div>
            <h2>بوابة الأطباء</h2>
            <p>لوحة تحكم سريرية شاملة تقدم لك التحليلات، مراقبة الحالات الطارئة، ومستشار طبي ذكي مدعوم بالأدلة الموثوقة.</p>
            <ul style="color: #cbd5e1; list-style-type: none; padding: 0; margin-bottom: 25px;">
                <li style="margin-bottom: 10px;">✔️ متابعة حية للمرضى</li>
                <li style="margin-bottom: 10px;">✔️ تنبيهات فورية للطوارئ</li>
                <li>✔️ مستشار ذكي بمرجعية رسمية</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)
    if st.button("دخول الأطباء ➔", key="doc_btn"):
        st.switch_page("pages/doctor_app.py")

with c2:
    st.markdown("""
        <div class="portal-card portal-patient">
            <div class="portal-icon-large">❤️</div>
            <h2>بوابة المرضى</h2>
            <p>سجل مؤشراتك الحيوية اليومية، وقم بتحليل أعراضك فورياً مع إمكانية التواصل المباشر والسريع مع طبيبك المختص.</p>
            <ul style="color: #cbd5e1; list-style-type: none; padding: 0; margin-bottom: 25px;">
                <li style="margin-bottom: 10px;">✔️ تسجيل يومياتك الصحية بسهولة</li>
                <li style="margin-bottom: 10px;">✔️ تحليل ذكي للصور والتقارير</li>
                <li>✔️ تواصل آمن ومباشر مع الطبيب</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)
    if st.button("دخول المرضى ➔", key="pat_btn"):
        st.switch_page("pages/patient_app.py")

# Trust & Footer
st.markdown("""
    <div style="margin-top: 80px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 40px; padding-bottom: 40px;">
        <h4 style="color: #94a3b8; margin-bottom: 20px;">موثوق ومدعوم بأحدث التقنيات</h4>
        <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; opacity: 0.6; filter: grayscale(100%);">
            <span style="font-size: 24px; font-weight: bold; color: white;">Google Gemini</span>
            <span style="font-size: 24px; font-weight: bold; color: white;">WHO Guidelines</span>
            <span style="font-size: 24px; font-weight: bold; color: white;">AHA</span>
            <span style="font-size: 24px; font-weight: bold; color: white;">NICE</span>
        </div>
        <p style="color: #475569; font-size: 13px; margin-top: 40px;">
            © 2026 CardioOS. هذا النظام قيد التجربة ولا يغني عن الاستشارة الطبية المتخصصة.
        </p>
    </div>
""", unsafe_allow_html=True)