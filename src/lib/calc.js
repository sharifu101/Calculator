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

/* ---------- your existing calculator ---------- */
export function calcAll({
  model, modulesQty, rcQty, psQty,
  controllerId, controllerQty, controllerPrice,
  installIsPercent, installValue, accessoriesTk, sft,
}) {
  const moduleUnit = model?.modulePrice ?? 0;
  const rcUnit = model?.receivingCardPrice ?? 0;
  const psUnit = model?.powerSupplyPrice ?? 0;
  const controllerTotal = (controllerPrice ?? 0) * (controllerQty ?? 0);

  const totalModules = (modulesQty ?? 0) * moduleUnit;
  const totalRC = (rcQty ?? 0) * rcUnit;
  const totalPS = (psQty ?? 0) * psUnit;

  const subTotal = totalModules + totalRC + totalPS + controllerTotal + (accessoriesTk ?? 0);

  const installation = installIsPercent ? subTotal * ((installValue ?? 0)/100) : (installValue ?? 0);
  const grandTotal = subTotal + installation;

  return {
    sft,
    totals: {
      totalModules, totalRC, totalPS, controllerTotal,
      accessories: accessoriesTk ?? 0,
      installation, subTotal, grandTotal,
    },
  };
}
