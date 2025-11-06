import { useEffect, useMemo, useState } from "react";
import { MODELS, CONTROLLERS } from "../data/models.js";
import { calcAll } from "../lib/calc.js";

/* ===== Price tiers (multiplier) ===== */
const PRICE_TIERS = [
  { id: "gold",     label: "Gold",     mult: 1.00, note: "Standard" },
  { id: "platinum", label: "Platinum", mult: 1.06, note: "≈6% premium" },
  { id: "diamond",  label: "Diamond",  mult: 1.12, note: "≈12% premium" },
];

/* নিজের টিয়ার টোটাল ক্যালকুলেটর (calcAll এর উপর নির্ভর করে না) */
function calcTotalsWithTier(snapshot){
  const { model, items, install, display, tier } = snapshot;
  const m = tier?.mult ?? 1;

  const unitModule   = (model.modulePrice ?? 0) * m;
  const unitCtrl     = (items.controllerPrice ?? 0) * m;
  const unitRC       = (model.receivingCardPrice ?? 0) * m;
  const unitPS       = (model.powerSupplyPrice ?? 0) * m;

  const totalModules = (items.modulesQty   ?? 0) * unitModule;
  const controllerTotal = (items.controllerQty ?? 0) * unitCtrl;
  const totalRC      = (items.rcQty        ?? 0) * unitRC;
  const totalPS      = (items.psQty        ?? 0) * unitPS;
  const accessories  = items.accessoriesTk ?? 0;         // accessories টিয়ারে না ধরেছি; চাইলে *m করো

  const subTotal = totalModules + controllerTotal + totalRC + totalPS + accessories;

  const installation = install.installIsPercent
    ? Math.round(subTotal * ((install.installValue ?? 0) / 100))
    : (install.installValue ?? 0);

  const grandTotal = subTotal + installation;

  return {
    // line totals
    totalModules, controllerTotal, totalRC, totalPS,
    // summary
    subTotal, installation, grandTotal,
    // reference for Invoice (unit prices needed there as well)
    unitPrices: { unitModule, unitCtrl, unitRC, unitPS, accessories },
    meta: { sft: display?.sft }
  };
}

export default function PriceForm({ onChange, onCalculated }) {
  const [modelId, setModelId] = useState(MODELS[0].id);
  const model = useMemo(() => MODELS.find(m => m.id === modelId), [modelId]);

  // Customer & display
  const [customer, setCustomer] = useState({ name: "", company: "", address: "", mobile: "" });
  const [display, setDisplay] = useState({ widthFt: "", heightFt: "", sft: "" });

  // Quantities
  const [modulesQty, setModulesQty] = useState(100);
  const [rcQty, setRcQty] = useState(10);
  const [psQty, setPsQty] = useState(17);

  // Controller
  const [controllerId, setControllerId] = useState(model.defaultController);
  const selectedController = useMemo(
    () => CONTROLLERS.find(c => c.id === controllerId) || CONTROLLERS[0],
    [controllerId]
  );
  const [controllerQty, setControllerQty] = useState(1);

  // Installation
  const [installIsPercent, setInstallIsPercent] = useState(false);
  const [installValue, setInstallValue] = useState(24000);

  // Accessories
  const [accessoriesTk, setAccessoriesTk] = useState(0);

  // ✅ Price tier
  const [tierId, setTierId] = useState("gold");

  // Auto-calc area (sft)
  useEffect(() => {
    const w = parseFloat(display.widthFt);
    const h = parseFloat(display.heightFt);
    if (!isNaN(w) && !isNaN(h)) {
      const area = (w * h).toFixed(2);
      setDisplay(d => ({ ...d, sft: area }));
    }
  }, [display.widthFt, display.heightFt]);

  const snapshot = useMemo(() => ({
    model,
    customer,
    display,
    items: {
      modulesQty,
      rcQty,
      psQty,
      controllerId,
      controllerQty,
      controllerPrice: selectedController?.price ?? 0,
      accessoriesTk,
    },
    install: { installIsPercent, installValue },
    tier: PRICE_TIERS.find(t => t.id === tierId) || PRICE_TIERS[0],
  }), [
    model, customer, display,
    modulesQty, rcQty, psQty,
    controllerId, controllerQty, selectedController,
    accessoriesTk, installIsPercent, installValue, tierId
  ]);

  useEffect(() => onChange?.(snapshot), [snapshot, onChange]);

  const handleCalculate = (e) => {
    e.preventDefault();

    // পুরোনো calcAll রেখে দিলাম (যদি কোনো জায়গায় দরকার পড়ে)
    const raw = calcAll({
      model,
      modulesQty,
      rcQty,
      psQty,
      controllerId,
      controllerQty,
      controllerPrice: selectedController?.price ?? 0,
      installIsPercent,
      installValue,
      accessoriesTk,
      sft: display.sft ? parseFloat(display.sft) : undefined,
    });

    // ✅ টিয়ার-অ্যাডজাস্টেড টোটাল ও ইউনিট প্রাইস
    const tierTotals = calcTotalsWithTier(snapshot);

    const finalResult = {
      ...raw,
      totals: tierTotals,          // summary ও line totals—Invoice/summary এইটা ব্যবহার করবে
      unitPrices: tierTotals.unitPrices
    };

    onCalculated?.(finalResult, snapshot);
  };

  return (
    <form onSubmit={handleCalculate} className="form-grid">
      {/* Product model */}
      <section>
        <h3>Product Model</h3>
        <div className="form-row">
          <label>
            Select Model (Pixel Pitch)
            <select className="select" value={modelId} onChange={e=>setModelId(e.target.value)}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>

          <label>
            Width (ft)
            <input className="input" value={display.widthFt}
              onChange={e=>setDisplay(d=>({...d,widthFt:e.target.value}))}/>
          </label>
          <label>
            Height (ft)
            <input className="input" value={display.heightFt}
              onChange={e=>setDisplay(d=>({...d,heightFt:e.target.value}))}/>
          </label>
          <label>
            Area (sft)
            <input className="input" value={display.sft}
              onChange={e=>setDisplay(d=>({...d,sft:e.target.value}))}/>
          </label>
        </div>

        {/* ✅ Tier selector */}
        <div className="tier-row" style={{marginTop:12}}>
          {PRICE_TIERS.map(t => (
            <button
              type="button"
              key={t.id}
              className={`tier-chip ${tierId===t.id ? "active" : ""}`}
              onClick={()=>setTierId(t.id)}
              aria-pressed={tierId===t.id}
            >
              <div className="tier-title">{t.label}</div>
              <div className="tier-note">{t.note}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Quantities */}
      <section>
        <h3>Quantities</h3>
        <div className="form-row">
          <NumberField label="Modules (pcs)" value={modulesQty} setValue={setModulesQty} />
          <NumberField label="Receiving Cards (pcs)" value={rcQty} setValue={setRcQty} />
          <NumberField label="Power Supplies (pcs)" value={psQty} setValue={setPsQty} />
        </div>
      </section>

      {/* Controller */}
      <section>
        <h3>Controller</h3>
        <div className="form-row">
          <label>
            Controller Model
            <select className="select" value={controllerId} onChange={e=>setControllerId(e.target.value)}>
              {CONTROLLERS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label} — ৳{c.price.toLocaleString("en-BD")}
                </option>
              ))}
            </select>
          </label>
          <NumberField label="Controller Qty" value={controllerQty} setValue={setControllerQty} />
          <label>
            Accessories / Cabinet (Tk)
            <input className="input" type="number" value={accessoriesTk}
              onChange={e=>setAccessoriesTk(parseFloat(e.target.value || 0))}/>
          </label>
        </div>
      </section>

      {/* Installation */}
      <section>
        <h3>Installation Cost</h3>
        <div className="inline">
          <label className="inline">
            <input className="radio" type="radio" checked={!installIsPercent} onChange={()=>setInstallIsPercent(false)} />
            <span>Flat (Tk)</span>
          </label>
          <label className="inline">
            <input className="radio" type="radio" checked={installIsPercent} onChange={()=>setInstallIsPercent(true)} />
            <span>Percent of subtotal (%)</span>
          </label>
        </div>
        <input className="input" style={{width:140}} type="number"
          value={installValue} onChange={e=>setInstallValue(parseFloat(e.target.value||0))}/>
      </section>

      {/* Customer */}
      <section>
        <h3>Customer Information</h3>
        <div className="form-row">
          <TextField label="Customer Name" value={customer.name}    onChange={v=>setCustomer(c=>({...c,name:v}))}/>
          <TextField label="Company Name"  value={customer.company} onChange={v=>setCustomer(c=>({...c,company:v}))}/>
          <TextField label="Mobile Number" value={customer.mobile}  onChange={v=>setCustomer(c=>({...c,mobile:v}))}/>
          <TextField label="Address"       value={customer.address} onChange={v=>setCustomer(c=>({...c,address:v}))}/>
        </div>
      </section>

      <div className="inline" style={{marginTop: 6}}>
        <button type="submit" className="btn btn-primary">Calculate</button>
      </div>
    </form>
  );
}

function NumberField({ label, value, setValue }) {
  return (
    <label>
      {label}
      <input className="input" type="number" value={value}
        onChange={e=>setValue(parseFloat(e.target.value||0))}/>
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input className="input" value={value} onChange={e=>onChange(e.target.value)}/>
    </label>
  );
}
