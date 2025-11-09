import { useEffect, useMemo, useRef, useState } from "react";
import { MODEL_GROUPS, CONTROLLERS, POWER_SUPPLY_PRICE } from "../data/models.js";
import { toBDT, calcAll } from "../lib/calc.js";

/* ===== Price tiers (display + warranty only) ===== */
const PRICE_TIERS = [
  { id: "gold",     label: "Gold",     note: "Standard",     warrantyYears: 1 },
  { id: "platinum", label: "Platinum", note: "≈6% premium",  warrantyYears: 2 },
  { id: "diamond",  label: "Diamond",  note: "≈12% premium", warrantyYears: 3 },
];

/* ===== Module physical size (in feet) =====
   320x160 mm => 1.0499 ft x 0.5249 ft
   192x192 mm => 0.6299 ft x 0.6299 ft
*/
const FT_320 = 1.0499;
const FT_160 = 0.5249;
const FT_192 = 0.6299;

function moduleFootprintFt(modelIdOrName) {
  const id = (modelIdOrName || "").toLowerCase();
  const isP3 = id.includes("p3") && !id.includes("3.9");
  const isP6 = id.includes("p6") && !id.includes("6.6"); // ignore 6.67 edge
  if (isP3 || isP6) return { w: FT_192, h: FT_192 };
  return { w: FT_320, h: FT_160 };
}

const roundInt = (x) => Math.max(1, Math.round(Number(x) || 0));

/* ===== Receiving Card auto-pick by rule =====
   - Indoor P1.25 → R732 (2900)
   - Others       → R712 (2200)
*/
function pickReceivingCard(dispType, modelName) {
  const isIndoor = dispType === "indoor";
  const isP125 = (modelName || "").toLowerCase().includes("p1.25");
  if (isIndoor && isP125) return { id: "R732", label: "Receiving Card R732", unitPrice: 2900 };
  return { id: "R712", label: "Receiving Card R712", unitPrice: 2200 };
}

/* ===== Capacity maps (modules per card/psu) ===== */
const RC_CAPACITY = {
  indoor: {
    "1.25": 4, "1.53": 4, "1.667": 6, "1.86": 8, "2": 10, "2.5": 11,
    "3": 12, "3.076": 16, "4": 20, "5": 24,
  },
  outdoor: {
    "2.5": 10, "3": 20, "3.076": 16, "4": 20, "5": 24,
    "6": 36, "6.7": 30, "8": 40, "10": 40,
  },
};

const PSU_CAPACITY = {
  indoor: {
    "1.25": 4, "1.53": 5, "1.667": 5, "1.86": 5,
    "2": 6,   "2.5": 6, "3": 6, "4": 6, "5": 6,
  },
  outdoor: {
    "2.5": 4, "3": 5, "3.076": 5, "4": 6, "5": 6,
    "6": 6, "6.67": 6, "6.7": 6, "8": 6, "10": 6,
  },
};

// ---- helpers: capacity lookups by parsed pitch ----
function getRcCapacity(dispType, modelName = "") {
  const p = parsePitch(modelName);
  return RC_CAPACITY[dispType]?.[p] ?? 12; // sensible fallback
}

function getPsuCapacity(dispType, modelName = "") {
  const p = parsePitch(modelName);
  return PSU_CAPACITY[dispType]?.[p] ?? 6; // sensible fallback
}


function parsePitch(modelName = "") {
  const m = (modelName.match(/P(\d+(?:\.\d+)?)/i) || [])[1];
  return m || "";
}
function parsePitchNum(modelName = "") {
  const m = modelName.match(/P(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : NaN;
}

/* ===== Controller caps (total pixels) =====
   Outdoor - A3L-655,360, A5L-1,300,000, A6L-2,600,000
   Indoor  - VP210H-1,300,000, VP410H-2,600,000, VP630-3,900,000, VP830-8,200,000
*/
const CTRL_CAP = {
  indoor: [
    { id: "VP210H", cap: 1300000 },
    { id: "VP410H", cap: 2600000 },
    { id: "VP630",  cap: 3900000 },
    { id: "VP830",  cap: 8200000 },
  ],
  outdoor: [
    { id: "A3L", cap: 655360 },
    { id: "A5L", cap: 1300000 },
    { id: "A6L", cap: 2600000 },
  ],
};

/* ===== PSU model pick (label only) =====
   - Indoor: সব pitch → 5V 40A
   - Outdoor: P2.5–P4 → 5V 60A, P5+ → 5V 40A
*/
function pickPSUModel(dispType, modelName) {
  if (dispType === "indoor") return { model: "5V 40A" };
  const p = parsePitchNum(modelName);
  if (!isNaN(p) && p <= 4) return { model: "5V 60A" };
  return { model: "5V 40A" };
}

/* Pitch/grid → total pixels */
function gridAndPixels(modelIdOrName, widthFt, heightFt) {
  const pitch = parsePitchNum(modelIdOrName); // mm
  if (!pitch || isNaN(pitch) || pitch <= 0) {
    return { across: 0, down: 0, modPxW: 0, modPxH: 0, totalPxW: 0, totalPxH: 0, totalPixels: 0 };
  }

  const id = (modelIdOrName || "").toLowerCase();
  const isP3 = id.includes("p3") && !id.includes("3.9");
  const isP6 = id.includes("p6") && !id.includes("6.6");
  const use192 = (isP3 || isP6);

  // module physical (mm)
  const mmW = use192 ? 192 : 320;
  const mmH = use192 ? 192 : 160;

  // pixels per module
  const modPxW = Math.round(mmW / pitch);
  const modPxH = Math.round(mmH / pitch);

  // module grid (same rounding scheme used elsewhere)
  const fp = moduleFootprintFt(modelIdOrName);
  const across = roundInt((parseFloat(widthFt)  || 0) / fp.w);
  const down   = roundInt((parseFloat(heightFt) || 0) / fp.h);

  const totalPxW = across * modPxW;
  const totalPxH = down   * modPxH;
  const totalPixels = totalPxW * totalPxH;

  return { across, down, modPxW, modPxH, totalPxW, totalPxH, totalPixels };
}

/* Pick controller by pixels & type (smallest that FITS; qty = ceil) */
function pickControllerByPixels(dispType, totalPixels) {
  const list = CTRL_CAP[dispType] || [];
  if (!totalPixels || !list.length) return null;
  // তুমি যেভাবে বলেছ: cap-এর চেয়ে বেশি হলে ওই model কাজ করবে না → next one
  const fit = list.find(c => totalPixels <= c.cap) || list[list.length - 1];
  const qty = Math.max(1, Math.ceil(totalPixels / fit.cap));
  return { id: fit.id, cap: fit.cap, qty };
}

/* ===== helpers to fetch prices from CONTROLLERS ===== */
function controllerPriceById(id) {
  const c = CONTROLLERS.find(x => x.id === id);
  return c ? (c.price || 0) : 0;
}

/* ===== Totals builder (uses calcAll) ===== */
function buildTotalsForCalc({ snapshot, autoModulesQty, moduleUnitPrice, rcUnitPrice }) {
  const { items, install, display } = snapshot;

  return calcAll({
    modulesQty: autoModulesQty,
    rcQty: items.rcQty ?? 0,
    psQty: items.psQty ?? 0,

    controllerQty: items.controllerQty ?? 0,
    controllerPrice: items.controllerPrice ?? 0,

    unitModule: moduleUnitPrice,
    unitRC: rcUnitPrice,
    unitPS: POWER_SUPPLY_PRICE,

    accessoriesTk: items.accessoriesTk ?? 0,
    installIsPercent: install.installIsPercent,
    installValue: install.installValue,
    sft: display?.sft,
  });
}

export default function PriceForm({ onChange, onCalculated }) {
  const [dispType, setDispType] = useState("indoor");
  const modelsForType = MODEL_GROUPS[dispType];

  /* model + controller */
  const [modelId, setModelId] = useState(modelsForType[0].id);
  const model = useMemo(
    () => modelsForType.find(m => m.id === modelId) ?? modelsForType[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelId, dispType]
  );

  const [controllerId, setControllerId] = useState(CONTROLLERS[0]?.id);
  const selectedController = useMemo(
    () => CONTROLLERS.find(c => c.id === controllerId) || CONTROLLERS[0],
    [controllerId]
  );

  // Customer & display
  const [customer, setCustomer] = useState({ name: "", company: "", address: "", mobile: "" });
  const [display, setDisplay] = useState({ widthFt: "", heightFt: "", sft: "" });

  // Quantities (rc & ps default; will auto-sync)
  const [rcQty, setRcQty] = useState(10);
  const [psQty, setPsQty] = useState(17);
  const [controllerQty, setControllerQty] = useState(1);

  // Installation
  const [installIsPercent, setInstallIsPercent] = useState(false);
  const [installValue, setInstallValue] = useState(24000);

  // Accessories
  const [accessoriesTk, setAccessoriesTk] = useState(0);

  // Tier
  const [tierId, setTierId] = useState("gold");
  const hasCalculatedRef = useRef(false);

  // switch type -> first model
  useEffect(() => {
    const first = MODEL_GROUPS[dispType][0];
    setModelId(first.id);
  }, [dispType]);

  // Auto-calc area (sft)
  useEffect(() => {
    const w = parseFloat(display.widthFt);
    const h = parseFloat(display.heightFt);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      const area = (w * h).toFixed(2);
      setDisplay(d => ({ ...d, sft: area }));
    }
  }, [display.widthFt, display.heightFt]);

  // Auto modules from ft → pcs (round, not ceil)
  const autoModulesQty = useMemo(() => {
    const w = parseFloat(display.widthFt);
    const h = parseFloat(display.heightFt);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return 0;

    const fp = moduleFootprintFt(model.id || model.name);
    const across = roundInt(w / fp.w);
    const down   = roundInt(h / fp.h);
    return across * down;
  }, [display.widthFt, display.heightFt, model]);

  // Tier-based module unit price
  const moduleUnitPrice = useMemo(() => {
    const p = model?.prices || {};
    return p[tierId] ?? 0;
  }, [model, tierId]);

  // Receiving card pick (model-based)
  const rcPicked = useMemo(
    () => pickReceivingCard(dispType, model?.name || ""),
    [dispType, model]
  );

  // ===== Auto RC/PS from capacity tables =====
  const autoRcQty = useMemo(() => {
    const cap = getRcCapacity(dispType, model.name);
    return cap > 0 ? Math.ceil((autoModulesQty || 0) / cap) : 0;
  }, [dispType, model, autoModulesQty]);

  const autoPsQty = useMemo(() => {
    const cap = getPsuCapacity(dispType, model.name);
    return cap > 0 ? Math.ceil((autoModulesQty || 0) / cap) : 0;
  }, [dispType, model, autoModulesQty]);

  // keep rc/ps in sync with auto when size/model/type changes
  useEffect(() => { setRcQty(autoRcQty); },
    [autoRcQty, dispType, modelId, display.widthFt, display.heightFt]);
  useEffect(() => { setPsQty(autoPsQty); },
    [autoPsQty, dispType, modelId, display.widthFt, display.heightFt]);

  // ===== Total pixels & auto controller pick =====
  const grid = useMemo(
    () => gridAndPixels(model.id || model.name, display.widthFt, display.heightFt),
    [model, display.widthFt, display.heightFt]
  );
  const totalPixels = grid.totalPixels;

  const autoController = useMemo(
    () => pickControllerByPixels(dispType, totalPixels),
    [dispType, totalPixels]
  );

  // apply auto controller selection (id + qty + price)
  useEffect(() => {
    if (!autoController) return;
    setControllerId(autoController.id);
    setControllerQty(autoController.qty);
  }, [autoController]);

  // PSU model label (for invoice brand column)
  const psuPicked = useMemo(
    () => pickPSUModel(dispType, model?.name || ""),
    [dispType, model]
  );

  const snapshot = useMemo(() => ({
    model: { ...model, name: `${model.name} ${dispType === "indoor" ? "(Indoor)" : "(Outdoor)"}` },
    customer,
    display,
    items: {
      modulesQty: autoModulesQty,
      rcQty,
      psQty,
      controllerId,
      controllerQty,
      controllerPrice: controllerPriceById(controllerId), // <-- price auto from selected id
      accessoriesTk,
      receivingPicked: rcPicked,
      psuPicked, // <-- for invoice display
      capacity: {
        rcModulesPerCard: getRcCapacity(dispType, model?.name || ""),
        psModulesPerUnit: getPsuCapacity(dispType, model?.name || ""),
      },
    },
    install: { installIsPercent, installValue },
    tier: PRICE_TIERS.find(t => t.id === tierId) || PRICE_TIERS[0],
  }), [
    model, dispType, customer, display,
    autoModulesQty, rcQty, psQty,
    controllerId, controllerQty,
    accessoriesTk, rcPicked, psuPicked,
    installIsPercent, installValue, tierId
  ]);

  useEffect(() => onChange?.(snapshot), [snapshot, onChange]);

  const computeAndSend = () => {
    const result = buildTotalsForCalc({
      snapshot,
      autoModulesQty,
      moduleUnitPrice,
      rcUnitPrice: rcPicked.unitPrice
    });
    onCalculated?.(result, snapshot);
  };

  const handleCalculate = (e) => {
    e?.preventDefault?.();
    hasCalculatedRef.current = true;
    computeAndSend();
  };

  // tier/size/model/qty change → auto recalc after first calculate
  useEffect(() => {
    if (hasCalculatedRef.current) computeAndSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tierId, rcPicked, moduleUnitPrice, autoModulesQty,
    rcQty, psQty, controllerQty, controllerId
  ]);

  return (
    <form onSubmit={handleCalculate} className="form-grid">
      {/* === Display Type === */}
      <section>
        <h3>Display Type</h3>
        <div className="inline">
          <label className="inline">
            <input
              className="radio"
              type="radio"
              checked={dispType === "indoor"}
              onChange={() => setDispType("indoor")}
            />
            <span>Indoor</span>
          </label>
          <label className="inline">
            <input
              className="radio"
              type="radio"
              checked={dispType === "outdoor"}
              onChange={() => setDispType("outdoor")}
            />
            <span>Outdoor</span>
          </label>
        </div>
      </section>

      {/* Product model */}
      <section>
        <h3>Product Model</h3>
        <div className="form-row">
          <label>
            Select Model (Pixel Pitch)
            <select
              className="select"
              value={modelId}
              onChange={e => setModelId(e.target.value)}
            >
              {modelsForType.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <label>
            Width (ft)
            <input
              className="input"
              value={display.widthFt}
              onChange={e => setDisplay(d => ({ ...d, widthFt: e.target.value }))}
              placeholder="e.g. 16"
            />
          </label>
          <label>
            Height (ft)
            <input
              className="input"
              value={display.heightFt}
              onChange={e => setDisplay(d => ({ ...d, heightFt: e.target.value }))}
              placeholder="e.g. 9"
            />
          </label>
          <label>
            Area (sft)
            <input
              className="input"
              value={display.sft}
              onChange={e => setDisplay(d => ({ ...d, sft: e.target.value }))}
            />
          </label>
        </div>

        {/* Tier selector */}
        <div className="tier-row" style={{ marginTop: 12 }}>
          {PRICE_TIERS.map(t => (
            <button
              type="button"
              key={t.id}
              className={`tier-chip ${tierId === t.id ? "active" : ""}`}
              onClick={() => setTierId(t.id)}
              aria-pressed={tierId === t.id}
            >
              <div className="tier-title">{t.label}</div>
              <div className="tier-note">{t.note}</div>
            </button>
          ))}
        </div>

        {/* Auto-computed preview */}
        <div className="form-row" style={{ marginTop: 10 }}>
          <label>
            Modules (auto)
            <input className="input" value={autoModulesQty || 0} readOnly />
          </label>
          <label>
            Module Unit Price (Tk)
            <input className="input" value={moduleUnitPrice ? toBDT(moduleUnitPrice) : "—"} readOnly />
          </label>
          <label>
            Receiving Card (auto)
            <input className="input" value={`${rcPicked.label} — ৳${rcPicked.unitPrice}`} readOnly />
          </label>
        </div>
      </section>

      {/* Quantities */}
      <section>
        <h3>Quantities</h3>
        <div className="form-row">
          <label>
            Receiving Cards (pcs)
            <span style={{fontSize:12, color:"#64748b"}}>
              auto: {autoRcQty} (cap: {(() => {
                const p = parsePitch(model?.name || ""); return RC_CAPACITY[dispType]?.[p] ?? 12;
              })()} modules/RC)
            </span>
            <input
              className="input"
              type="number"
              value={rcQty}
              onChange={e => setRcQty(parseFloat(e.target.value || 0))}
            />
          </label>
          <label>
            Power Supplies (pcs)
            <span style={{fontSize:12, color:"#64748b"}}>
              auto: {autoPsQty} (cap: {(() => {
                const p = parsePitch(model?.name || ""); return PSU_CAPACITY[dispType]?.[p] ?? 6;
              })()} modules/PSU) • {psuPicked.model}
            </span>
            <input
              className="input"
              type="number"
              value={psQty}
              onChange={e => setPsQty(parseFloat(e.target.value || 0))}
            />
          </label>
          <label>
            Controller Qty
            <input
              className="input"
              type="number"
              value={controllerQty}
              onChange={e => setControllerQty(parseFloat(e.target.value || 0))}
            />
          </label>
        </div>
      </section>

      {/* Controller */}
      <section>
        <h3>Controller</h3>
        <div className="form-row">
          <label>
            Controller Model
            <select
              className="select"
              value={controllerId}
              onChange={e => setControllerId(e.target.value)}
            >
              {CONTROLLERS.filter(c => c.kind !== "receiving").map(c => (
                <option key={c.id} value={c.id}>
                  {c.label} — ৳{c.price.toLocaleString("en-BD")}
                </option>
              ))}
            </select>
            {autoController && (
              <div className="hint" style={{fontSize:12, color:"#64748b"}}>
                Suggested: {autoController.id} (cap {autoController.cap.toLocaleString()} px) • Qty {autoController.qty}
              </div>
            )}
          </label>
          <label>
            Accessories / Cabinet (Tk)
            <input
              className="input"
              type="number"
              value={accessoriesTk}
              onChange={e => setAccessoriesTk(parseFloat(e.target.value || 0))}
            />
          </label>
        </div>
      </section>

      {/* Installation */}
      <section>
        <h3>Installation Cost</h3>
        <div className="inline">
          <label className="inline">
            <input
              className="radio"
              type="radio"
              checked={!installIsPercent}
              onChange={() => setInstallIsPercent(false)}
            />
            <span>Flat (Tk)</span>
          </label>
          <label className="inline">
            <input
              className="radio"
              type="radio"
              checked={installIsPercent}
              onChange={() => setInstallIsPercent(true)}
            />
            <span>Percent of subtotal (%)</span>
          </label>
        </div>
        <input
          className="input"
          style={{ width: 140 }}
          type="number"
          value={installValue}
          onChange={e => setInstallValue(parseFloat(e.target.value || 0))}
        />
      </section>

      {/* Customer */}
      <section>
        <h3>Customer Information</h3>
        <div className="form-row">
          <TextField label="Customer Name" value={customer.name}    onChange={v => setCustomer(c => ({ ...c, name: v }))} />
          <TextField label="Company Name"  value={customer.company} onChange={v => setCustomer(c => ({ ...c, company: v }))} />
          <TextField label="Mobile Number" value={customer.mobile}  onChange={v => setCustomer(c => ({ ...c, mobile: v }))} />
          <TextField label="Address"       value={customer.address} onChange={v => setCustomer(c => ({ ...c, address: v }))} />
        </div>
      </section>

      <div className="inline" style={{ marginTop: 6 }}>
        <button type="submit" className="btn btn-primary">Calculate</button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input className="input" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}
