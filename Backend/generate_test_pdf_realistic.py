# generate_test_pdf_realistic.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

fn = "safedocs_realistic_pdf.pdf"
c = canvas.Canvas(fn, pagesize=letter)
c.setFont("Helvetica", 12)
c.drawString(72, 720, "SafeDocs Realistic Demo - PDF (INERT JS/HTML STUBS)")
c.drawString(72, 700, "Marker: X-SAFEDOCS-MARKER: MAL_TEST_PDF_JS_STUB")
c.drawString(72, 680, "--- BEGIN PSEUDO-HTML-JS-STUB ---")
c.drawString(72, 660, "<script>/* inert stub: alert('demo'); */</script>")
c.drawString(72, 640, "--- END PSEUDO-HTML-JS-STUB ---")
c.drawString(72, 620, "Embedded object placeholder: OLE_PAYLOAD_STUB")
c.save()
print("Created", fn)
