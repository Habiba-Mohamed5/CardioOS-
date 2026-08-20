from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import report_store as rs
import os
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientInput(BaseModel):
    patient_id: str
    display_name: str = None

class ReportInput(BaseModel):
    report: dict
    kind: str = "daily"

@app.get("/api/patients")
def get_patients():
    return rs.list_patients()

@app.post("/api/patients")
def register_patient(data: PatientInput):
    key = rs.register_patient(data.patient_id, data.display_name)
    return {"key": key}

@app.get("/api/patients/{patient_id}/reports")
def get_reports(patient_id: str):
    return rs.get_patient_reports(patient_id)

@app.post("/api/patients/{patient_id}/reports")
def add_report(patient_id: str, data: ReportInput):
    report_id = rs.add_report(patient_id, data.report, data.kind)
    return {"report_id": report_id}

@app.post("/api/patients/{patient_id}/reports/{report_id}/review")
def review_report(patient_id: str, report_id: str):
    rs.mark_reviewed(patient_id, report_id)
    return {"status": "success"}

@app.get("/api/patients/{patient_id}/vitals/latest")
def latest_vitals(patient_id: str):
    return rs.get_latest_vitals(patient_id)

@app.get("/api/stats/population")
def population_stats(field: str):
    return rs.get_population_stats(field)

@app.get("/api/patients/{patient_id}/audit")
def audit_log(patient_id: str):
    return rs.get_audit_log(patient_id)
