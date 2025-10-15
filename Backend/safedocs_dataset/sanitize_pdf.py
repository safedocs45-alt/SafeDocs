import shutil
from pathlib import Path
from PyPDF2 import PdfReader, PdfWriter

def sanitize_pdf(in_path: Path | str, out_path: Path | str):
    in_path  = Path(in_path)
    out_path = Path(out_path)
    removed = []
    try:
        reader = PdfReader(str(in_path))
        writer = PdfWriter()
        # strip OpenAction, EmbeddedFiles, AA
        root = reader.trailer.get("/Root", {})
        if isinstance(root, dict) and "/OpenAction" in root:
            del root["/OpenAction"]; removed.append("OpenAction")
        if isinstance(root, dict) and "/Names" in root and isinstance(root["/Names"], dict):
            names = root["/Names"]
            if "/EmbeddedFiles" in names:
                del names["/EmbeddedFiles"]; removed.append("EmbeddedFiles")
        for page in reader.pages:
            if "/AA" in page:
                del page["/AA"]; removed.append("Page.AA")
            writer.add_page(page)
        with open(out_path, "wb") as f: writer.write(f)
        return {"status":"ok","sanitized_file":str(out_path),"removed": sorted(set(removed))}
    except Exception as e:
        shutil.copy(in_path, out_path)
        return {"status":"failed","sanitized_file":str(out_path),"removed": [], "error": str(e)}
