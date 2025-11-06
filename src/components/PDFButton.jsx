// src/components/PDFButton.jsx
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

const A4 = { w: 595.28, h: 841.89 }; // pt

async function fetchBytes(url){ const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`); return new Uint8Array(await r.arrayBuffer()); }
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

export default function PDFButton({ targetId="invoice-root", filename="Mugnee_Invoice.pdf" }){
  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if(!el) return;

    // ✅ add print-quality class (turns off blur/shadow, enforces crisp fonts)
    el.classList.add("print-quality");
    await sleep(40);

    // Hide preview pad while capturing
    const padEls = el.querySelectorAll(".pad-bg");
    padEls.forEach(n => (n.style.display = "none"));

    try{
      // ✅ hi-DPI scale (min 2, max 4)
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
        removeContainer: true
      });

      const pngUrl = canvas.toDataURL("image/png");
      const capBytes = await (await fetch(pngUrl)).arrayBuffer();

      // Restore UI
      padEls.forEach(n => (n.style.display = ""));
      el.classList.remove("print-quality");

      // === Build PDF ===
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([A4.w, A4.h]);

      // Pad background (optional)
      try{
        const padPng = await pdf.embedPng(await fetchBytes("/Mugnee_Invoice.png"));
        page.drawImage(padPng, { x:0, y:0, width:A4.w, height:A4.h });
      }catch{}

      // ✅ place captured image inside SAFE box with minimal downscale
      const SAFE = { x: 36, y: 90, w: A4.w - 72, h: A4.h - 170 };
      const img = await pdf.embedPng(capBytes);
      const ratio = canvas.height / canvas.width;

      const drawW = SAFE.w;
      const drawH = Math.min(SAFE.h, drawW * ratio);
      const drawX = SAFE.x;
      const drawY = (A4.h - SAFE.h - SAFE.y) + (SAFE.h - drawH)/2;

      page.drawImage(img, { x:drawX, y:drawY, width:drawW, height:drawH });

      const out = await pdf.save();
      const blob = new Blob([out], { type:"application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }catch(err){
      console.error(err);
      alert("High-res PDF তৈরি হয় নি। public/Mugnee_Invoice.png আছে কিনা দেখে নিন।");
      // Restore on error too
      padEls.forEach(n => (n.style.display = ""));
      el.classList.remove("print-quality");
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-primary">
      Download Invoice (PDF)
    </button>
  );
}
