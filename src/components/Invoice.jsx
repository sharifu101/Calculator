import { forwardRef, useMemo } from "react";
import { toBDT, bdtToWords, generateRef } from "../lib/calc.js";

const Invoice = forwardRef(function Invoice({ calc, snapshot, orderDate = new Date() }, ref) {
  const { model, customer, display, items, tier } = snapshot;
  const { totals, unitPrices } = calc;

  const dateStr = new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"2-digit", year:"2-digit" }).format(orderDate);
  const refNo = useMemo(() => generateRef(), []);

  const unitModule = unitPrices?.unitModule ?? 0;
  const unitCtrl   = unitPrices?.unitCtrl   ?? (items.controllerPrice ?? 0);
  const unitRC     = unitPrices?.unitRC     ?? 0;
  const unitPS     = unitPrices?.unitPS     ?? 0;

  const rcBrand = items?.receivingPicked?.id || "R712";
  const rcCap = items?.capacity?.rcModulesPerCard;
  const psCap = items?.capacity?.psModulesPerUnit;
  const psuModel = items?.psuPicked?.model || "5V 40A";

  const rows = [
    { sl:1, name:`Module: ${model.name} LED Display Module`, unit:"Pcs", qty:items.modulesQty,   unitPrice:unitModule, total:totals.totalModules,   brand:"Brand: —" },
    { sl:2, name:`Controller: ${items.controllerId}`,        unit:"Pcs", qty:items.controllerQty, unitPrice:unitCtrl,   total:totals.controllerTotal, brand:"Brand: —" },
    { sl:3, name:`Receiving Card`,                           unit:"Pcs", qty:items.rcQty,        unitPrice:unitRC,     total:totals.totalRC,
      brand:`Model: ${rcBrand}${rcCap ? ` • ${rcCap} modules/RC` : ""}` },
    { sl:4, name:`Power Supply`,                             unit:"Pcs", qty:items.psQty,        unitPrice:unitPS,     total:totals.totalPS,
      brand: `${psuModel}${psCap ? ` • ${psCap} modules/PSU` : ""}` },

    // Accessories row (qty=1)
    ...(totals.accessories ? [{
      sl:5, name:"Structure & Accessories", unit:"Lot", qty:1,
      unitPrice: unitPrices?.accessories ?? totals.accessories, total: totals.accessories, brand:""
    }] : []),

    { sl:(totals.accessories ? 6 : 5), name:"Installation, Testing & Commissioning", unit:"Make", qty:1, unitPrice:totals.installation, total:totals.installation, brand:"" },
  ];

  const sizeStr = `${display.widthFt || "—"}ft × ${display.heightFt || "—"}ft`;

  return (
    <div ref={ref}>
      {/* Ref + Date */}
      <div className="ref-row">
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
              <th style={{width:80}}>Unit</th>
              <th style={{width:100}} className="td-right">Quantity</th>
              <th style={{width:140}} className="td-right">Unit Price (Taka)</th>
              <th style={{width:160}} className="td-right">Total Price (Taka)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.sl}>
                <td>{r.sl}</td>
                <td>
                  <div className="item-name">{r.name}</div>
                  {r.brand && <div className="item-brand">{r.brand}</div>}
                </td>
                <td>{r.unit}</td>
                <td className="td-right">{r.qty}</td>
                <td className="td-right">{toBDT(r.unitPrice)}</td>
                <td className="td-right">{toBDT(r.total)}</td>
              </tr>
            ))}
            <tr className="row-subtle">
              <td colSpan={5} className="td-right"><b>Subtotal</b></td>
              <td className="td-right"><b>{toBDT(totals.subTotal)}</b></td>
            </tr>
            <tr className="row-subtle">
              <td colSpan={5} className="td-right">Installation</td>
              <td className="td-right">{toBDT(totals.installation)}</td>
            </tr>
            <tr className="row-accent">
              <td colSpan={5} className="td-right total-big">Grand Total</td>
              <td className="td-right total-big">{toBDT(totals.grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="in-words"><b>In Words:</b> {bdtToWords(totals.grandTotal)}</div>

        <div className="signatures">
          <img src="/seal.png" alt="Seal" className="seal-img" />
          <div className="sig-block">
            <img src="/signature.png" alt="Signature" className="sign-img" />
          </div>
        </div>
      </div>

      <div className="invoice-foot">36-37 (3rd Floor), Umesh Datta Road, Chawkbazar, Dhaka-1211</div>
    </div>
  );
});

export default Invoice;
