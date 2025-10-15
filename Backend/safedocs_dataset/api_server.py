# api_server.py
from __future__ import annotations
import io
import json
import mimetypes
import inspect
import tempfile
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

# --- existing DB + auth (UNTOUCHED) ---
from db import init_mongo, db, gfs_uploads, gfs_clean, gfs_reports
from auth import router as auth_router, get_current_user
from scan_file import scan_bytes

# Sanitizers (prefer bytes versions if present; otherwise path-based)
try:
    from sanitize_pdf import sanitize_pdf_bytes as _sanitize_pdf_bytes
except Exception:
    _sanitize_pdf_bytes = None
try:
    from sanitize_pdf import sanitize_pdf as _sanitize_pdf_path
except Exception:
    _sanitize_pdf_path = None

try:
    from sanitize_ooxml import sanitize_ooxml_bytes as _sanitize_ooxml_bytes
except Exception:
    _sanitize_ooxml_bytes = None
try:
    from sanitize_ooxml import sanitize_ooxml as _sanitize_ooxml_path
except Exception:
    _sanitize_ooxml_path = None

try:
    from sanitize_rtf import sanitize_rtf_bytes as _sanitize_rtf_bytes
except Exception:
    _sanitize_rtf_bytes = None
try:
    from sanitize_rtf import sanitize_rtf as _sanitize_rtf_path
except Exception:
    _sanitize_rtf_path = None


app = FastAPI(title="SafeDocs API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- helpers to support both Motor (async) and PyMongo (sync) ----
async def _maybe_await(x):
    return await x if inspect.isawaitable(x) else x

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _sha256(b: bytes) -> str:
    h = hashlib.sha256(); h.update(b); return h.hexdigest()

# ---------- Helpers ----------
ACCEPTED_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".rtf": "application/rtf",
}
def _ext_of(filename: str) -> str:
    fn = filename or ""
    dot = fn.rfind(".")
    return fn[dot:].lower() if dot != -1 else ""
def _content_type_for(filename: str) -> str:
    ext = _ext_of(filename)
    return ACCEPTED_TYPES.get(ext) or mimetypes.guess_type(filename)[0] or "application/octet-stream"

# --- robust ID coercion for GridFS ---
def _coerce_file_id(file_id: str):
    """Try to coerce a 24-hex string into ObjectId; else return as-is."""
    try:
        from bson import ObjectId
        if isinstance(file_id, str) and len(file_id) == 24:
            return ObjectId(file_id)
    except Exception:
        pass
    return file_id

# --- Sanitization wrapper (always produces bytes; marks changed/notes) ---
def _sanitize_with_available_tools(ext: str, content: bytes, filename: str) -> Dict[str, Any]:
    """
    Returns:
      {
        "clean_bytes": <bytes>,
        "sanitizer": {
           "engine": "...",
           "removed": [...],
           "notes": [...],
           "error": "...",
           "changed": True|False,
        }
      }
    """
    import os, tempfile
    meta: Dict[str, Any] = {}
    clean: bytes | None = None
    orig_sha = _sha256(content)

    # 1) bytes-style (if defined)
    try:
        if ext == ".pdf" and _sanitize_pdf_bytes:
            try:
                b = _sanitize_pdf_bytes(content)
                if isinstance(b, (bytes, bytearray)):
                    clean = bytes(b); meta["engine"] = "sanitize_pdf_bytes"
            except Exception as e:
                meta["error"] = f"pdf_bytes_sanitize_error: {e}"
        elif ext in (".docx", ".pptx", ".xlsx") and _sanitize_ooxml_bytes:
            try:
                b = _sanitize_ooxml_bytes(content, ext=ext.lstrip("."))
                if isinstance(b, (bytes, bytearray)):
                    clean = bytes(b); meta["engine"] = "sanitize_ooxml_bytes"
            except Exception as e:
                meta["error"] = f"ooxml_bytes_sanitize_error: {e}"
        elif ext == ".rtf" and _sanitize_rtf_bytes:
            try:
                b = _sanitize_rtf_bytes(content)
                if isinstance(b, (bytes, bytearray)):
                    clean = bytes(b); meta["engine"] = "sanitize_rtf_bytes"
            except Exception as e:
                meta["error"] = f"rtf_bytes_sanitize_error: {e}"
    except Exception as e:
        meta["error"] = str(e)

    # 2) path-based (always write out_path and read it back)
    if clean is None:
        with tempfile.TemporaryDirectory() as td:
            in_path  = os.path.join(td, f"in{ext or '.bin'}")
            out_path = os.path.join(td, f"out{ext or '.bin'}")
            with open(in_path, "wb") as f: f.write(content)
            try:
                res = None
                if ext == ".pdf" and _sanitize_pdf_path:
                    res = _sanitize_pdf_path(in_path, out_path); meta["engine"] = "sanitize_pdf"
                elif ext in (".docx", ".pptx", ".xlsx") and _sanitize_ooxml_path:
                    try:
                        res = _sanitize_ooxml_path(in_path, out_path)
                    except TypeError:
                        res = _sanitize_ooxml_path(in_path)
                    meta["engine"] = "sanitize_ooxml"
                elif ext == ".rtf" and _sanitize_rtf_path:
                    res = _sanitize_rtf_path(in_path, out_path); meta["engine"] = "sanitize_rtf"
                else:
                    res = None

                # capture hints
                if isinstance(res, dict):
                    if "removed" in res: meta["removed"] = res["removed"]
                    if "notes" in res:   meta.setdefault("notes", []).extend(res["notes"])

                # read sanitizer output (sanitizers should write output or copy original)
                with open(out_path, "rb") as outf:
                    clean = outf.read()
            except Exception as e:
                meta["error"] = f"path_sanitizer_error: {e}"
                # try to read whatever exists, else fallback to original
                try:
                    with open(out_path, "rb") as outf:
                        clean = outf.read()
                except Exception:
                    clean = content

    if clean is None:
        clean = content
        meta.setdefault("engine", "passthrough")
        meta.setdefault("notes", []).append("Unsupported type; original retained")

    meta["changed"] = (_sha256(clean) != orig_sha)
    return {"clean_bytes": clean, "sanitizer": meta, "error": meta.get("error")}

# ---- Finding beautifier for user-readable "Findings" ----
def _humanize_findings(raw_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    nice = []
    for f in raw_findings or []:
        if not isinstance(f, dict):
            nice.append({"title": str(f), "message": "", "severity": "info", "raw": f})
            continue
        title = f.get("id") or f.get("threat_type") or f.get("title") or f.get("name") or f.get("type") or "Indicator"
        msg = f.get("message") or f.get("indicator") or f.get("description") or f.get("details") or ""
        sev = f.get("severity") or f.get("sev") or f.get("level") or "info"

        lower = (str(title) + " " + str(msg)).lower()
        explain = None
        if "vba" in lower or "macro" in lower:
            explain = "This Office document contains a VBA macro that may run code when content is enabled."
        elif "javascript" in lower or "/openaction" in lower or "/js" in lower:
            explain = "This PDF declares JavaScript or auto-run actions, often abused to execute code on open."
        elif "embedded" in lower and ("object" in lower or "file" in lower):
            explain = "Embedded object/file detected; payloads can be hidden inside embedded objects."
        elif "rtf" in lower and ("object" in lower or "field" in lower):
            explain = "RTF object/field constructs detected; these are frequently abused to launch external content."

        nice.append({
            "title": str(title),
            "message": str(msg),
            "severity": str(sev),
            "explain": explain,
            "raw": f,
        })
    return nice

# ------------ startup / shutdown ------------
@app.on_event("startup")
async def _startup():
    await init_mongo(app)
    print("✅ Database initialized")
    try:
        pref = getattr(auth_router, "prefix", "") or ""
        if pref.startswith("/api/"):
            app.include_router(auth_router)
        elif pref.startswith("/auth"):
            app.include_router(auth_router, prefix="/api")
        else:
            app.include_router(auth_router, prefix="/api/auth")
        print("🔐 Auth routes mounted")
    except Exception as e:
        print(f"⚠️  Failed to mount auth router: {e}")
    print("🚀 SafeDocs API ready")

@app.on_event("shutdown")
async def _shutdown():
    print("👋 Shutting down SafeDocs API")

@app.get("/api/health")
def health():
    return {"ok": True}

# ---------- Scan endpoint ----------
@app.post("/api/scan")
async def scan_endpoint(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Flow:
      1) Save original upload (GridFS)
      2) Scan original (raw_scan)
      3) Sanitize (bytes or path sanitizer by type)
      4) **Re-scan sanitized bytes** (post_clean_scan)
      5) Save clean file & JSON report (GridFS)
      6) Insert scans row (DB) and return links
    """
    user_id = str(current_user["_id"])
    filename = file.filename or "upload.bin"
    content_type = _content_type_for(filename)

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    sha = _sha256(raw)
    ext = _ext_of(filename) or ""

    # 1) Save original upload
    try:
        uploads = gfs_uploads()
        up_meta = {
            "user_id": user_id,
            "filename": filename,
            "content_type": content_type,
            "size": len(raw),
            "sha256": sha,
            "created_at": _now_iso(),
        }
        upload_id = await _maybe_await(uploads.upload_from_stream(filename, io.BytesIO(raw), metadata=up_meta))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed saving upload: {e}")

    # 2) Scan original
    try:
        raw_result = scan_bytes(raw, filename=filename, content_type=content_type)
        if not isinstance(raw_result, dict):
            raise RuntimeError("scanner returned non-dict")
    except Exception as e:
        raw_result = {
            "ok": False,
            "verdict": "benign",
            "risk_score": 0.0,
            "model_scores": {"lgbm": 0.0, "tree": 0.0, "dl": 0.0, "rules": 0.0},
            "meta": {"file": filename, "size_bytes": len(raw), "sha256": sha},
            "report": {"version": 1, "engine": "fallback", "verdict": "benign", "risk_score": 0.0},
            "error": f"scan failure: {e}",
        }

    verdict = raw_result.get("verdict")
    try:
        risk_score = float(raw_result.get("risk_score") or raw_result.get("report", {}).get("risk_score") or 0.0)
    except Exception:
        risk_score = 0.0
    if verdict in (None, "scan_error"):
        verdict = "malicious" if risk_score >= 0.5 else "benign"
        raw_result["verdict"] = verdict

    raw_signals = raw_result.get("model_scores") or raw_result.get("signals") or raw_result.get("report", {}).get("signals") or {}
    raw_findings = (
        raw_result.get("findings")
        or raw_result.get("report", {}).get("findings")
        or raw_result.get("report", {}).get("report", {}).get("findings")
        or []
    )
    nice_findings = _humanize_findings(raw_findings)
    recommendations = raw_result.get("recommendations") or raw_result.get("report", {}).get("recommendations") or []

    # 3) Sanitize — ALWAYS use sanitizer output and record changed flag/notes
    try:
        if isinstance(raw_result.get("clean_bytes"), (bytes, bytearray)):
            san_out = {
                "clean_bytes": bytes(raw_result["clean_bytes"]),
                "sanitizer": {"engine": "scanner_clean_bytes", "changed": (_sha256(raw_result["clean_bytes"]) != sha)}
            }
        elif isinstance(raw_result.get("sanitized_bytes"), (bytes, bytearray)):
            san_out = {
                "clean_bytes": bytes(raw_result["sanitized_bytes"]),
                "sanitizer": {"engine": "scanner_sanitized_bytes", "changed": (_sha256(raw_result["sanitized_bytes"]) != sha)}
            }
        else:
            san_out = _sanitize_with_available_tools(ext, raw, filename)
    except Exception as e:
        san_out = {"clean_bytes": raw, "sanitizer": {"engine": "passthrough", "error": str(e), "changed": False}}

    clean_bytes = san_out["clean_bytes"]
    sanitizer_meta = san_out.get("sanitizer") or {}
    sanitized_flag = True  # we always produce bytes; changed flag shows if modified

    # 4) Re-scan sanitized bytes (this is the key bit you were missing)
    clean_sha = _sha256(clean_bytes)
    clean_filename = f"{sha}_clean{ext or ''}".strip()
    try:
        clean_result = scan_bytes(clean_bytes, filename=clean_filename, content_type=content_type)
        if not isinstance(clean_result, dict):
            raise RuntimeError("scanner returned non-dict (clean)")
    except Exception as e:
        clean_result = {
            "ok": False,
            "verdict": "benign",
            "risk_score": 0.0,
            "model_scores": {"lgbm": 0.0, "tree": 0.0, "dl": 0.0, "rules": 0.0},
            "meta": {"file": clean_filename, "size_bytes": len(clean_bytes), "sha256": clean_sha},
            "report": {"version": 1, "engine": "fallback", "verdict": "benign", "risk_score": 0.0},
            "error": f"scan failure (clean): {e}",
        }

    try:
        post_risk = float(clean_result.get("risk_score") or clean_result.get("report", {}).get("risk_score") or 0.0)
    except Exception:
        post_risk = 0.0
    post_verdict = clean_result.get("verdict") or ("malicious" if post_risk >= 0.5 else "benign")
    post_signals = clean_result.get("model_scores") or clean_result.get("signals") or clean_result.get("report", {}).get("signals") or {}
    post_findings = (
        clean_result.get("findings")
        or clean_result.get("report", {}).get("findings")
        or clean_result.get("report", {}).get("report", {}).get("findings")
        or []
    )

    # 5) Save clean file + report
    try:
        clean = gfs_clean()
        clean_meta = {
            "user_id": user_id,
            "source_upload_id": str(upload_id),
            "filename": clean_filename,
            "content_type": content_type,
            "size": len(clean_bytes),
            "verdict": post_verdict,      # reflect verdict on the sanitized artifact
            "risk_score": post_risk,      # reflect risk on the sanitized artifact
            "sha256": clean_sha,
            "sanitized": sanitized_flag,
            "sanitizer_meta": sanitizer_meta,
            "created_at": _now_iso(),
        }
        clean_id = await _maybe_await(clean.upload_from_stream(clean_filename, io.BytesIO(clean_bytes), metadata=clean_meta))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed saving clean file: {e}")

    # Build a comprehensive report
    try:
        report_doc = {
            "version": 1,
            "engine": "safedocs-ensemble",
            "filename": filename,
            "original_sha256": sha,
            "size_bytes": len(raw),
            "content_type": content_type,

            # ORIGINAL scan result
            "verdict": verdict,
            "risk_score": float(risk_score),
            "signals": raw_signals,
            "findings": nice_findings,
            "raw_findings": raw_findings,

            # POST-SANITIZATION scan result
            "post_clean_scan": {
                "filename": clean_filename,
                "sha256": clean_sha,
                "risk_score": float(post_risk),
                "verdict": post_verdict,
                "signals": post_signals,
                "findings": post_findings,
                "delta_risk": float(post_risk - risk_score),
            },

            "recommendations": recommendations,
            "sanitizer": sanitizer_meta,
            "sanitized": sanitized_flag,
            "clean_file": {
                "filename": clean_filename,
                "content_type": content_type,
                "size_bytes": len(clean_bytes),
                "gridfs_id": None,
            },
            "timestamps": {"uploaded_at": up_meta["created_at"], "scanned_at": _now_iso()},
            "source_upload_id": str(upload_id),
            "clean_id": None,
            "user_id": user_id,
        }
        report_doc["clean_file"]["gridfs_id"] = str(clean_id)
        report_doc["clean_id"] = str(clean_id)

        reports = gfs_reports()
        report_bytes = json.dumps(report_doc, indent=2, default=str).encode("utf-8")
        report_meta = {
            "user_id": user_id,
            "upload_id": str(upload_id),
            "clean_id": str(clean_id),
            "filename": f"{sha}.report.json",
            "created_at": _now_iso(),
        }
        report_id = await _maybe_await(reports.upload_from_stream(report_meta["filename"], io.BytesIO(report_bytes), metadata=report_meta))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed saving report: {e}")

    # 6) Persist scan record (DB shape preserved)
    try:
        scans_coll = db().scans
        doc = {
            "user_id": user_id,
            "upload_id": str(upload_id),
            "clean_id": str(report_doc["clean_id"]),
            "report_id": str(report_id),
            "filename": filename,
            "clean_filename": clean_filename,
            "content_type": content_type,
            "size": len(raw),
            "sha256": sha,
            "verdict": verdict,                 # original file verdict (keep as-is)
            "risk_score": risk_score,           # original file risk
            "created_at": datetime.now(timezone.utc),
            # legacy url fields (dashboard will rebuild anyway)
            "report_url": f"/report/{str(report_id)}.json",
            "download_clean_url": f"/download/{str(report_doc['clean_id'])}",
        }
        res = scans_coll.insert_one(doc)
        if inspect.isawaitable(res):
            await res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed writing scans row: {e}")

    # Response (non-breaking, extra fields included)
    return JSONResponse({
        "ok": True,
        "filename": filename,
        "content_type": content_type,
        "size": len(raw),
        "sha256": sha,

        # original
        "verdict": verdict,
        "risk_score": float(risk_score),
        "signals": raw_signals,
        "findings": _humanize_findings(raw_findings),
        "raw_findings": raw_findings,
        "recommendations": recommendations,

        # sanitizer + post-clean scan summary
        "sanitizer": sanitizer_meta,
        "sanitized": sanitized_flag,
        "post_clean_scan": {
            "filename": clean_filename,
            "sha256": clean_sha,
            "risk_score": float(post_risk),
            "verdict": post_verdict,
            "delta_risk": float(post_risk - risk_score),
        },

        "report_id": str(report_id),
        "report_api": f"/report/{str(report_id)}.json",
        "download_api": f"/download/{str(report_doc['clean_id'])}",
        "clean_filename": clean_filename,
        "scan_id": str(upload_id),
    })

# ---------- My scans ----------
@app.get("/api/me/scans")
async def me_scans(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    coll = db().scans
    query = {"user_id": user_id}

    cur = coll.find(query).sort("created_at", -1).skip(offset).limit(limit)
    items: List[Dict[str, Any]] = []
    if hasattr(cur, "to_list"):
        docs = await cur.to_list(length=limit)
    else:
        docs = list(cur)

    for d in docs:
        rid = str(d.get("report_id", "") or "")
        cid = str(d.get("clean_id", "") or "")
        items.append({
            "scan_id": str(d.get("_id", "")),
            "filename": d.get("filename"),
            "created_at": d.get("created_at"),
            "verdict": d.get("verdict"),
            "risk_score": float(d.get("risk_score", 0.0)),
            "report_url": f"/report/{rid}.json" if rid else None,
            "download_clean_url": f"/download/{cid}" if cid else None,
        })

    return {"items": items, "limit": limit, "offset": offset}

# ---------- My stats ----------
@app.get("/api/me/stats")
async def me_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    coll = db().scans
    query = {"user_id": user_id}

    total_res = coll.count_documents(query)
    total = await total_res if inspect.isawaitable(total_res) else total_res

    benign_res = coll.count_documents({**query, "verdict": "benign"})
    benign = await benign_res if inspect.isawaitable(benign_res) else benign_res

    malicious_res = coll.count_documents({**query, "verdict": "malicious"})
    malicious = await malicious_res if inspect.isawaitable(malicious_res) else malicious_res

    last_activity = None
    cur = coll.find(query).sort("created_at", -1).limit(1)
    if hasattr(cur, "to_list"):
        docs = await cur.to_list(length=1)
        if docs: last_activity = docs[0].get("created_at")
    else:
        for d in cur:
            last_activity = d.get("created_at"); break

    return {
        "total_scans": int(total or 0),
        "benign": int(benign or 0),
        "malicious": int(malicious or 0),
        "last_activity": last_activity,
    }

# ---------- Fetch JSON report ----------
@app.get("/api/report/{report_id}.json")
async def get_report(report_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    bucket = gfs_reports()
    try:
        fid = _coerce_file_id(report_id)
        gridout = await _maybe_await(bucket.open_download_stream(fid))
    except Exception:
        raise HTTPException(status_code=404, detail="Report not found")

    meta = getattr(gridout, "metadata", {}) or {}
    if meta.get("user_id") != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="Report not found")

    if hasattr(gridout, "readchunk"):
        async def _aiter():
            while True:
                chunk = await _maybe_await(gridout.readchunk())
                if not chunk: break
                yield chunk
        return StreamingResponse(_aiter(), media_type="application/json")
    else:
        def _iter():
            for chunk in gridout: yield chunk
        return StreamingResponse(_iter(), media_type="application/json")

# ---------- Download clean file ----------
@app.get("/api/download/{file_id}")
async def download_clean(file_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    bucket = gfs_clean()
    try:
        fid = _coerce_file_id(file_id)
        gridout = await _maybe_await(bucket.open_download_stream(fid))
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    meta = getattr(gridout, "metadata", {}) or {}
    if meta.get("user_id") != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="File not found")

    filename = meta.get("filename") or "clean.bin"
    media = meta.get("content_type") or "application/octet-stream"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    if hasattr(gridout, "readchunk"):
        async def _aiter():
            while True:
                chunk = await _maybe_await(gridout.readchunk())
                if not chunk: break
                yield chunk
        return StreamingResponse(_aiter(), media_type=media, headers=headers)
    else:
        def _iter():
            for chunk in gridout: yield chunk
        return StreamingResponse(_iter(), media_type=media, headers=headers)
