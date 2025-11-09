// src/components/PDFButton.jsx
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

const A4 = { w: 595.28, h: 841.89 }; // pt

async function fetchBytes(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PDFButton({
  targetId = "invoice-root",
  filename = "Mugnee_Invoice.pdf",
}) {
  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;

    // ✅ Only-for-PDF: make content bigger & crisper
    el.classList.add("print-quality");
    el.classList.add("invoice--pdf-scale"); // <— new controlled zoom for PDF
    await sleep(40);

    // hide pad bg while capture (optional)
    const padEls = el.querySelectorAll(".pad-bg");
    padEls.forEach((n) => (n.style.display = "none"));

    try {
      const scale = Math.min(4, Math.max(2, (window.devicePixelRatio || 1) * 2));

      const canvas = await html2canvas(el, {
        scale,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        removeContainer: true,
      });

      const pngUrl = canvas.toDataURL("image/png");
      const capBytes = await (await fetch(pngUrl)).arrayBuffer();

      // restore UI classes before building PDF
      padEls.forEach((n) => (n.style.display = ""));
      el.classList.remove("print-quality");
      el.classList.remove("invoice--pdf-scale");

      // === Build PDF ===
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([A4.w, A4.h]);

      // Optional: draw pad background (A4)
      try {
        const padPng = await pdf.embedPng(await fetchBytes("/Mugnee_Invoice.png"));
        page.drawImage(padPng, { x: 0, y: 0, width: A4.w, height: A4.h });
      } catch {}

      // ✅ SAFE box — পাশের ফাঁকা কম, উপর/নীচে একটু বেশি
      // (top ~90pt, bottom ~70pt, side ~8pt) → পড়া আরও বড়/সহজ
      const SAFE = { x: 8, y: 90, w: A4.w - 16, h: A4.h - 160 };

      // CONTAIN-fit inside SAFE
      const img = await pdf.embedPng(capBytes);
      const ratio = canvas.height / canvas.width; // h/w
      let drawW = SAFE.w;
      let drawH = drawW * ratio;
      if (drawH > SAFE.h) {
        drawH = SAFE.h;
        drawW = drawH / ratio;
      }
      const drawX = SAFE.x + (SAFE.w - drawW) / 2;
      const drawY = SAFE.y + (SAFE.h - drawH) / 2;

      page.drawImage(img, { x: drawX, y: drawY, width: drawW, height: drawH });

      const out = await pdf.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      alert("High-res PDF তৈরি হয়নি। public/Mugnee_Invoice.png আছে কিনা দেখে নিন।");
      // restore on error
      padEls.forEach((n) => (n.style.display = ""));
      el.classList.remove("print-quality");
      el.classList.remove("invoice--pdf-scale");
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-primary">
      Download Invoice (PDF)
    </button>
  );
}
