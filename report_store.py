"""
CardioOS — Shared Report Store
--------------------------------
The missing link between doctor_app.py and patient_app.py. No real auth
needed for a hackathon: the patient types a name/ID once, it's kept in
st.session_state, and used as the key for every report they submit.

Import this from BOTH patient_app.py and doctor_app.py:
    import report_store as rs

File layout it creates:
    shared_data/
        patients_registry.json          -> {patient_id: {display_name, registered_at}}
        reports/
            <patient_id>.json           -> list of report dicts for that patient
        notes/
            <patient_id>.json           -> list of doctor note dicts for that patient
        audit/
            <patient_id>.json           -> list of audit log entries for that patient
"""
import json
import re
from pathlib import Path
from datetime import datetime

import config

SHARED_DIR = config.BASE_DIR / "shared_data"
REPORTS_DIR = SHARED_DIR / "reports"
NOTES_DIR = SHARED_DIR / "notes"
AUDIT_DIR = SHARED_DIR / "audit"
REGISTRY_FILE = SHARED_DIR / "patients_registry.json"

REPORTS_DIR.mkdir(parents=True, exist_ok=True)
NOTES_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_DIR.mkdir(parents=True, exist_ok=True)

# Fields that count as "vitals" for trend charts / population stats
VITAL_FIELDS = ["systolic", "diastolic", "sugar", "weight"]


def _safe_id(patient_id: str) -> str:
    """Turns a display name into a filesystem-safe id. Keeps only
    alnum/underscore/dash/Arabic letters — everything else stripped."""
    cleaned = re.sub(r"[^\w\-\u0600-\u06FF]", "_", patient_id.strip())
    return cleaned or "unknown_patient"


def _patient_file(patient_id: str) -> Path:
    return REPORTS_DIR / f"{_safe_id(patient_id)}.json"


def _notes_file(patient_id: str) -> Path:
    return NOTES_DIR / f"{_safe_id(patient_id)}.json"


def _audit_file(patient_id: str) -> Path:
    return AUDIT_DIR / f"{_safe_id(patient_id)}.json"


def _load_json(path: Path, default):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def _save_json(path: Path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Patient registry — so the doctor app can list "who are my patients"
# without scanning the filesystem blindly
# ---------------------------------------------------------------------------
def register_patient(patient_id: str, display_name: str = None):
    registry = _load_json(REGISTRY_FILE, {})
    key = _safe_id(patient_id)
    if key not in registry:
        registry[key] = {
            "display_name": display_name or patient_id,
            "registered_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        }
        _save_json(REGISTRY_FILE, registry)
    return key


def list_patients() -> dict:
    """Returns {patient_key: {display_name, registered_at}}"""
    return _load_json(REGISTRY_FILE, {})


# ---------------------------------------------------------------------------
# Reports — the core of the patient <-> doctor link
# ---------------------------------------------------------------------------
def add_report(patient_id: str, report: dict, kind: str = "daily") -> str:
    """kind: 'daily' (routine log) or 'consultation_urgent' or 'consultation_routine'
    (booking request). Returns the report's id.

    If report contains 'latest_vitals' (a dict with systolic/diastolic/sugar/weight),
    those fields are ALSO flattened onto the top level of the stored report so
    get_patient_trend() / get_population_stats() can find them directly.
    """
    key = _safe_id(patient_id)
    fp = _patient_file(key)
    reports = _load_json(fp, [])

    report = dict(report)  # don't mutate caller's dict
    report["id"] = f"{key}-{len(reports) + 1}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    report["date"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    report["kind"] = kind
    report.setdefault("status", "new")  # new | reviewed

    # Flatten latest_vitals -> top-level vital fields (for trend/population stats)
    vitals = report.get("latest_vitals") or {}
    for field in VITAL_FIELDS:
        if field in vitals and vitals[field] is not None:
            report[field] = vitals[field]

    reports.append(report)
    _save_json(fp, reports)
    log_audit(patient_id, f"تقرير جديد أُرسل ({kind})", actor="Patient")
    return report["id"]


def get_patient_reports(patient_id: str, newest_first: bool = True) -> list:
    key = _safe_id(patient_id)
    reports = _load_json(_patient_file(key), [])
    if newest_first:
        reports = list(reversed(reports))
    return reports


def delete_report(patient_id: str, report_id: str):
    key = _safe_id(patient_id)
    fp = _patient_file(key)
    reports = _load_json(fp, [])
    reports = [r for r in reports if r.get("id") != report_id]
    _save_json(fp, reports)
    log_audit(patient_id, f"تقرير محذوف ({report_id})", actor="Doctor")


def mark_reviewed(patient_id: str, report_id: str):
    key = _safe_id(patient_id)
    fp = _patient_file(key)
    reports = _load_json(fp, [])
    for r in reports:
        if r.get("id") == report_id:
            r["status"] = "reviewed"
    _save_json(fp, reports)
    log_audit(patient_id, f"تقرير تمت مراجعته ({report_id})", actor="Doctor")


def get_patient_trend(patient_id: str, field: str, limit: int = 30) -> list:
    """Returns [(date, value), ...] oldest-first for a numeric field
    (e.g. 'systolic', 'sugar', 'weight') — for the 'compare to your own
    history' feature."""
    reports = get_patient_reports(patient_id, newest_first=False)
    out = []
    for r in reports[-limit:]:
        if field in r and r[field] is not None:
            out.append((r["date"], r[field]))
    return out


def get_latest_vitals(patient_id: str) -> dict:
    """Returns the most recent known vitals dict for a patient (from their
    most recent report that carried vitals), or {} if none exist yet."""
    reports = get_patient_reports(patient_id, newest_first=True)
    for r in reports:
        if any(f in r for f in VITAL_FIELDS):
            return {f: r[f] for f in VITAL_FIELDS if f in r}
    return {}


# ---------------------------------------------------------------------------
# Population stats — for the "compare this patient to all other patients"
# benchmarking tab
# ---------------------------------------------------------------------------
def get_population_stats(field: str) -> list:
    """Returns a list of the LATEST known value of `field` across every
    registered patient (one value per patient, most recent report that has it)."""
    values = []
    for key in list_patients().keys():
        latest = get_latest_vitals(key)
        if field in latest and latest[field] is not None:
            values.append(latest[field])
    return values


# ---------------------------------------------------------------------------
# Doctor's clinical notes — separate from patient-submitted reports
# ---------------------------------------------------------------------------
def add_doctor_note(patient_id: str, note_text: str, doctor_name: str = "Dr.") -> str:
    key = _safe_id(patient_id)
    fp = _notes_file(key)
    notes = _load_json(fp, [])
    note = {
        "id": f"note-{len(notes) + 1}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "doctor_name": doctor_name,
        "text": note_text,
    }
    notes.append(note)
    _save_json(fp, notes)
    log_audit(patient_id, "ملاحظة طبية جديدة أُضيفت", actor=doctor_name)
    return note["id"]


def get_doctor_notes(patient_id: str, newest_first: bool = True) -> list:
    key = _safe_id(patient_id)
    notes = _load_json(_notes_file(key), [])
    if newest_first:
        notes = list(reversed(notes))
    return notes


# ---------------------------------------------------------------------------
# Audit trail — who did what, and when (traceability for the hackathon judges)
# ---------------------------------------------------------------------------
def log_audit(patient_id: str, action: str, actor: str = "System"):
    key = _safe_id(patient_id)
    fp = _audit_file(key)
    entries = _load_json(fp, [])
    entries.append({
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "actor": actor,
        "action": action,
    })
    _save_json(fp, entries)


def get_audit_log(patient_id: str, newest_first: bool = True) -> list:
    key = _safe_id(patient_id)
    entries = _load_json(_audit_file(key), [])
    if newest_first:
        entries = list(reversed(entries))
    return entries