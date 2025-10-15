# run_all_realistic.py
import subprocess, sys
scripts = [
    "generate_test_docx_realistic.py",
    "generate_test_xlsx_realistic.py",
    "generate_test_pptx_realistic.py",
    "generate_test_pdf_realistic.py"
]
for s in scripts:
    print("Running", s)
    subprocess.run([sys.executable, s], check=False)
print("Done - realistic demo files created.")
