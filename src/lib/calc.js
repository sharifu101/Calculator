// src/lib/calc.js
export function toBDT(n) {
  if (isNaN(n)) return "৳0";
  return "৳" + Math.round(n).toLocaleString("en-BD");
}

/* ---------- Amount in words (BDT, crore/lakh) ---------- */
export function bdtToWords(amount) {
  const units = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens  = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function two(n){ if(n<20) return units[n]; const t=Math.floor(n/10),u=n%10; return tens[t]+(u?(" "+units[u]):""); }
  function three(n){ const h=Math.floor(n/100),r=n%100; return (h? units[h]+" Hundred"+(r?" ":""):"") + (r? two(r):""); }

  amount = Math.round(amount||0);
  if (!amount) return "Zero Taka Only.";

  const crore=Math.floor(amount/10000000); amount%=10000000;
  const lakh =Math.floor(amount/100000);   amount%=100000;
  const th   =Math.floor(amount/1000);     amount%=1000;
  const rest =amount;

  let parts=[];
  if(crore) parts.push(three(crore)+" Crore");
  if(lakh)  parts.push(three(lakh)+" Lakh");
  if(th)    parts.push(three(th)+" Thousand");
  if(rest)  parts.push(three(rest));
  return parts.join(" ") + " Taka Only.";
}

/* ---------- simple Ref No generator ---------- */
export function generateRef() {
  const d=new Date();
  const y=String(d.getFullYear()).slice(-2), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  const rnd=Math.floor(1000+Math.random()*9000);
  return `HO/MQ-${y}${m}${day}-${rnd}`;
}

/* ---------- MODERNIZED calcAll (explicit unit prices) ---------- */
/* Rules (as per latest):
   - Accessories: base = max(accessoriesTk, 24000). (Subtotal-এ যোগ হবে)
   - Installation: base min 24000 / % mode + scaling; BUT Grand Total-এ যোগ হবে না।
   - If area (sft) > 60: accessories & installation—দুটোই স্কেল-আপ হবে (+15% প্রতি অতিরিক্ত 10 sft)
   - Grand Total = Subtotal (installation exclude)
*/
export function calcAll({
  modulesQty = 0, rcQty = 0, psQty = 0,
  controllerQty = 0, controllerPrice = 0,
  unitModule = 0, unitRC = 0, unitPS = 0,
  accessoriesTk = 0,
  installIsPercent = false, installValue = 0,
  sft = 0,
}) {
  const totalModules    = modulesQty * unitModule;
  const totalRC         = rcQty * unitRC;
  const totalPS         = psQty * unitPS;
  const controllerTotal = controllerQty * controllerPrice;

  // base of goods (without installation & accessories)
  const goodsSubTotal = totalModules + totalRC + totalPS + controllerTotal;

  const area = parseFloat(sft) || 0;

  // Accessories (>= 24k)
  let accTk = Math.max(accessoriesTk || 0, 24000);

  // Installation (>=24k or % of goods) — কিন্তু গ্র্যান্ড টোটালে যোগ হবে না
  let installTk = installIsPercent
    ? Math.round(goodsSubTotal * ((installValue || 0) / 100))
    : Math.max(installValue || 0, 24000);

  // Scaling for >60 sft
  if (area > 60) {
    const steps = Math.floor((area - 60) / 10);
    const extraFactor = 1 + 0.15 * steps;
    accTk = Math.round(accTk * extraFactor);
    installTk = Math.round(installTk * extraFactor);
  }

  // Subtotal includes accessories only
  const subTotal = goodsSubTotal + accTk;
  // Grand total = subtotal (installation excluded)
  const grandTotal = subTotal;

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
