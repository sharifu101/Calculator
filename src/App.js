// src/App.js
import { useRef, useState } from "react";
import PriceForm from "./components/PriceForm";
import Invoice from "./components/Invoice";
import PDFButton from "./components/PDFButton";
import { toBDT } from "./lib/calc.js";

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [calc, setCalc] = useState(null);
  const invoiceRef = useRef(null);

  return (
    <>
      {/* Topbar / Header */}
      <header className="topbar">
        <div className="inner">
          <img src="/logo.png" alt="Mugnee" className="topbar-logo" />
          <div className="topbar-title">MUGNEE MULTIPLE LIMITED — Price Builder</div>

          {/* Nav */}
          <nav className="topbar-nav">
            <a href="https://www.mugnee.com/" className="top-link">Home</a>
          </nav>

          <div className="topbar-right">
            <span className="badge">LED Display • Controller • Install</span>
          </div>
        </div>
      </header>

      <div className="app-shell">
        <div className="container-xxl">
          {/* Left: Form */}
          <div className="card">
            <div className="brand-row" style={{ marginBottom: 10 }}>
              <div className="brand-left">
                <img src="/logo.png" alt="Mugnee" className="brand-logo" />
                <div>
                  <div className="brand-title">LED Display Price Builder</div>
                  <div className="brand-sub">
                    Model-wise module, receiving card, controller, power & installation
                  </div>
                </div>
              </div>
            </div>

            <PriceForm
              onChange={(snap) => setSnapshot(snap)}
              onCalculated={(result, snap) => {
                setCalc(result);
                setSnapshot(snap);
              }}
            />

            {calc && (
              <div className="summary">
                <div className="sum-card">
                  <div className="sum-label">Subtotal</div>
                  <div className="sum-value">{toBDT(calc.totals.subTotal)}</div>
                </div>
                <div className="sum-card">
                  <div className="sum-label">Grand Total</div>
                  <div className="sum-value">{toBDT(calc.totals.grandTotal)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Invoice + Download */}
          <div className="card">
            <div className="inline" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <h3>Invoice Preview</h3>
              <PDFButton targetId="invoice-root" filename="/Mugnee_Invoice.pdf" />
            </div>

            {!calc || !snapshot ? (
              <div className="brand-sub">
                Fill the form and click <b>Calculate</b> to preview the invoice.
              </div>
            ) : (
              <div id="invoice-root" className="invoice-wrap invoice-dark preview-mode">
                <img src="/Mugnee_Invoice.png" className="invoice-pad-bg pad--contain" alt="" />
                <div className="invoice-inner pad-safe">
                  <div className="invoice-panel">
                    <Invoice ref={invoiceRef} calc={calc} snapshot={snapshot} />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
