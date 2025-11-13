// src/lib/calc.js

export function toBDT(n) {
  if (isNaN(n)) return "৳0";
  return "৳" + Math.round(n).toLocaleString("en-BD");
}

/* ---------- Amount in words (BDT, crore/lakh) ---------- */
export function bdtToWords(amount) {
  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"
  ];
  const tens  = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function two(n) {
    if (n < 20) return units[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return tens[t] + (u ? (" " + units[u]) : "");
  }

  function three(n) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (
      (h ? units[h] + " Hundred" + (r ? " " : "") : "") +
      (r ? two(r) : "")
    );
  }

  amount = Math.round(amount || 0);
  if (!amount) return "Zero Taka Only.";

  const crore = Math.floor(amount / 10000000); amount %= 10000000;
  const lakh  = Math.floor(amount / 100000);   amount %= 100000;
  const th    = Math.floor(amount / 1000);     amount %= 1000;
  const rest  = amount;

  let parts = [];
  if (crore) parts.push(three(crore) + " Crore");
  if (lakh)  parts.push(three(lakh)  + " Lakh");
  if (th)    parts.push(three(th)    + " Thousand");
  if (rest)  parts.push(three(rest));

  return parts.join(" ") + " Taka Only.";
}

export function generateRef() {
  const d   = new Date();
  const y   = String(d.getFullYear()).slice(-2);
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `HO/MQ-${y}${m}${day}-${rnd}`;
}

/*
  Structure & Accessories:
    - area < 60 → 24,000 Tk
    - area ≥ 60 → area × 420
  Installation:
    - সবসময় area × 400
  Grand Total:
    - goods + accessories + installation
*/
export function calcAll({
  modulesQty = 0,
  rcQty = 0,
  psQty = 0,
  controllerQty = 0,
  controllerPrice = 0,
  unitModule = 0,
  unitRC = 0,
  unitPS = 0,
  accessoriesTk = 0,
  installIsPercent = false,
  installValue = 0,
  sft = 0,
}) {
  const totalModules    = modulesQty * unitModule;
  const totalRC         = rcQty * unitRC;
  const totalPS         = psQty * unitPS;
  const controllerTotal = controllerQty * controllerPrice;

  const goodsSubTotal = totalModules + totalRC + totalPS + controllerTotal;

  const area = parseFloat(sft) || 0;

  let accTk = 0;
  if (area > 0 && area < 60) {
    accTk = 24000;
  } else if (area >= 60) {
    accTk = Math.round(area * 420);
  } else {
    accTk = 0;
  }

  let installTk = 0;
  if (area > 0) {
    installTk = Math.round(area * 400);
  } else {
    installTk = 0;
  }

  const subTotal = goodsSubTotal + accTk;
  const grandTotal = subTotal + installTk;

  return {
    sft,
    totals: {
      totalModules,
      totalRC,
      totalPS,
      controllerTotal,
      accessories: accTk,
      installation: installTk,
      subTotal,
      grandTotal,
    },
    unitPrices: {
      unitModule,
      unitRC,
      unitPS,
      unitCtrl: controllerPrice,
      accessories: accTk,
    },
  };
}
