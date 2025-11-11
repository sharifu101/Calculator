// src/components/PDFButton.jsx
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

const A4 = { w: 595.28, h: 841.89 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PDFButton({ targetId = "invoice-root", filename = "Mugnee_Invoice.pdf" }) {
  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if (!el) return alert("Invoice root পাওয়া যায়নি!");

    // Preview → PDF: pad contain → cover
    el.classList.add("pad--cover");
    el.classList.remove("pad--contain");
    el.classList.add("invoice--pdf-scale");
    el.classList.remove("preview-mode");
    await sleep(40);

    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const png = canvas.toDataURL("image/png");
      const bytes = await (await fetch(png)).arrayBuffer();

      const pdf = await PDFDocument.create();
      const page = pdf.addPage([A4.w, A4.h]);
      const img = await pdf.embedPng(bytes);
      page.drawImage(img, { x: 0, y: 0, width: A4.w, height: A4.h });

      const out = await pdf.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      alert("PDF তৈরি হয়নি। Console এ error দেখুন।");
    } finally {
      // PDF → Preview: cover → contain
      el.classList.remove("invoice--pdf-scale");
      el.classList.add("preview-mode");
      el.classList.remove("pad--cover");
      el.classList.add("pad--contain");
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-primary">
      Download Invoice (PDF)
    </button>
  );
}
