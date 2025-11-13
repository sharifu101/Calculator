// src/components/Invoice.jsx
import { forwardRef, useMemo } from "react";
import { toBDT, bdtToWords, generateRef } from "../lib/calc.js";

const Invoice = forwardRef(function Invoice({ calc, snapshot, orderDate = new Date() }, ref) {
  const { model, customer, display, items, tier } = snapshot;
  const { totals, unitPrices } = calc;

  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(orderDate);
  const refNo = useMemo(() => generateRef(), []);

  const unitModule = unitPrices?.unitModule ?? 0;
  const unitCtrl   = unitPrices?.unitCtrl   ?? (items.controllerPrice ?? 0);
  const unitRC     = unitPrices?.unitRC     ?? 0;
  const unitPS     = unitPrices?.unitPS     ?? 0;

  const sizeStr = `${display.widthFt || "—"}ft × ${display.heightFt || "—"}ft`;

  // ---- Dynamic rows (SL auto) ----
  const rows = [];
  let sl = 1;

  // Module
  rows.push({
    sl: sl++,
    name: `Module: ${model.name} LED Display Module`,
    unit: "Pcs",
    qty: items.modulesQty,
    unitPrice: unitModule,
    total: totals.totalModules,
  });

  // Controller – শুধু যখন qty>0 এবং id আছে
  if (items.controllerQty > 0 && items.controllerId) {
    rows.push({
      sl: sl++,
      name: `Controller: ${items.controllerId}`,
      unit: "Pcs",
      qty: items.controllerQty,
      unitPrice: unitCtrl,
      total: totals.controllerTotal,
    });
  }

  // Receiving card
  rows.push({
    sl: sl++,
    name: "Receiving Card",
    unit: "Pcs",
    qty: items.rcQty,
    unitPrice: unitRC,
    total: totals.totalRC,
  });

  // Power supply
  rows.push({
    sl: sl++,
    name: "Power Supply",
    unit: "Pcs",
    qty: items.psQty,
    unitPrice: unitPS,
    total: totals.totalPS,
  });

  // Structure & Accessories (if any)
  if (totals.accessories) {
    rows.push({
      sl: sl++,
      name: "Structure & Accessories",
      unit: "Lot",
      qty: 1,
      unitPrice: unitPrices?.accessories ?? totals.accessories,
      total: totals.accessories,
    });
  }

  // Installation
  rows.push({
    sl: sl++,
    name: "Installation, Testing & Commissioning",
    unit: "Make",
    qty: 1,
    unitPrice: totals.installation,
    total: totals.installation,
  });

  return (
    <div ref={ref}>
      {/* Ref + Date */}
      <div className="ref-row tidy">
        <div className="ref-left"><strong>Ref:</strong> {refNo}</div>
        <div className="ref-right"><strong>Date:</strong> {dateStr}</div>
      </div>

      {/* Customer box */}
      <div className="info-box">
        <div className="info-title">Customer Information</div>
        <div className="info-grid">
          <div><span>Customer Name:</span> {customer.name || "—"}</div>
          <div><span>Customer Position:</span> —</div>
          <div><span>Organization Name:</span> {customer.company || "—"}</div>
          <div><span>Address:</span> {customer.address || "—"}</div>
          <div><span>Mobile Number:</span> {customer.mobile || "—"}</div>
          <div><span>Pixel Pitch:</span> {model.name}</div>
          <div><span>Display Size (sft):</span> {display.sft || "—"}</div>
          <div><span>Warranty:</span> {(tier?.warrantyYears ?? 1)} Year(s)</div>
        </div>
      </div>

      {/* Invoice content panel */}
      <div className="invoice-panel">
        <div className="price-title">
          <div className="price-title-left">
            <strong>{model.name} LED Display — {sizeStr}</strong>
          </div>
          <div
            className={`tier-badge ${tier?.id || "gold"}`}
            title={`${tier?.label || "Gold"} • ${(tier?.warrantyYears ?? 1)} Year Warranty`}
          >
            {(tier?.label || "Gold")} • {(tier?.warrantyYears ?? 1)} Year Warranty
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{width:60}}>SL.</th>
              <th>Item Name</th>
              <th style={{width:80}} className="td-center">Unit</th>
              <th style={{width:100}} className="td-center">Quantity</th>
              <th style={{width:140}} className="td-right">Unit Price (Taka)</th>
              <th style={{width:160}} className="td-right">Total Price (Taka)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.sl}>
                <td>{r.sl}</td>
                <td>
                  <div className="item-name">{r.name}</div>
                </td>
                <td className="td-center">{r.unit}</td>
                <td className="td-center">{r.qty}</td>
                <td className="td-right">{toBDT(r.unitPrice)}</td>
                <td className="td-right">{toBDT(r.total)}</td>
              </tr>
            ))}

            <tr className="row-subtle">
              <td colSpan={5} className="td-right"><b>Subtotal</b></td>
              <td className="td-right"><b>{toBDT(totals.subTotal)}</b></td>
            </tr>

            <tr className="row-accent">
              <td colSpan={5} className="td-right total-big">Grand Total</td>
              <td className="td-right total-big">{toBDT(totals.grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="in-words"><b>In Words:</b> {bdtToWords(totals.grandTotal)}</div>

        {/* ✅ seal/signature */}
        <div className="signatures lift">
          <img src="/seal.png" alt="Company Seal" className="seal-img" />
          <div className="sig-block">
            <img src="/signature.png" alt="Authorized Signature" className="sign-img" />
            <div className="sig-title">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Invoice;
