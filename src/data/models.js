// src/data/models.js

// ---- Tiered module pricing (per-module) ----
// NOTE: প্রতি Type-এর তিনটি প্রাইস = [Gold, Platinum, Diamond]
export const MODEL_GROUPS = {
  indoor: [
    { id: "in-p1_25",  name: "P1.25",  prices: { gold: 6816, platinum: 8721, diamond: 9593 } },
    { id: "in-p1_53",  name: "P1.53",  prices: { gold: 6082, platinum: 7115, diamond: 9478 } },
    { id: "in-p1_86",  name: "P1.86",  prices: { gold: 4017, platinum: 5073, diamond: 7229 } },
    { id: "in-p2",     name: "P2",     prices: { gold: 3581, platinum: 4476, diamond: 6381 } },
    { id: "in-p2_5",   name: "P2.5",   prices: { gold: 2365, platinum: 2755, diamond: 3237 } },
    { id: "in-p3",     name: "P3",     prices: { gold: 1769, platinum: 2044, diamond: 2618 } },
  ],
  outdoor: [
    { id: "out-p2_5",  name: "P2.5",   prices: { gold: 4568, platinum: 5600, diamond: 7688 } },
    { id: "out-p3",    name: "P3",     prices: { gold: 2618, platinum: 3237, diamond: 3627 } },
    { id: "out-p4",    name: "P4",     prices: { gold: 2503, platinum: 2939, diamond: 3214 } },
    { id: "out-p5",    name: "P5",     prices: { gold: 2205, platinum: 2503, diamond: 3604 } },
    { id: "out-p6",    name: "P6",     prices: { gold: 1860, platinum: 1998, diamond: 2227 } },
    { id: "out-p6_67", name: "P6.67",  prices: { gold: 2205, platinum: 2365, diamond: 2640 } },
    { id: "out-p8",    name: "P8",     prices: { gold: 1929, platinum: 2044, diamond: 2227 } },
    { id: "out-p10",   name: "P10",    prices: { gold: 1677, platinum: 1746, diamond: 1883 } },
  ],
};

// ---- Controllers / Processors / Control Cards ----
export const CONTROLLERS = [
  // Control cards
  { id: "WF1",     label: "Control Card WF1",     price: 562 },
  { id: "WF2",     label: "Control Card WF2",     price: 687 },
  { id: "WF4",     label: "Control Card WF4",     price: 1109 },

  // Receiving: (শুধু রেফারেন্সের জন্য; কুয়ান্টিটি আলাদা ফিল্ডে)
  // নোট: অটো-পিক রুল PriceForm-এ আছে (P1.25 indoor → R732; বাকিগুলো → R712)
  // এখানে শুধুমাত্র দামের সোর্স হিসেবে রাখলাম
  { id: "R712",    label: "Receiving Card R712",  price: 2200, kind: "receiving" },
  { id: "R732",    label: "Receiving Card R732",  price: 2900, kind: "receiving" },

  // Asynchronous
  { id: "A3L",     label: "Asynchronous A3L",     price: 9205 },
  { id: "A5L",     label: "Asynchronous A5L",     price: 25368 },
  { id: "A6L",     label: "Asynchronous A6L",     price: 39396 },

  // Synchronous (video processor)
  { id: "D16",     label: "Controller D16",       price: 6136 },
  { id: "C16L",    label: "Controller C16L",      price: 9540 },
  { id: "VP210H",  label: "Synchronous VP210H",   price: 22995 },
  { id: "VP410H",  label: "Synchronous VP410H",   price: 27398 },
  { id: "VP630",   label: "Synchronous VP630",    price: 65940 },
  { id: "VP830",   label: "Synchronous VP830",    price: 90790 },
  { id: "VP1240A", label: "Synchronous VP1240A",  price: 114845 },
  { id: "VP1220S", label: "Synchronous VP1220S",  price: 85025 },
  { id: "VP1620S", label: "Synchronous VP1620S",  price: 94965 },
  { id: "VP1640A", label: "Synchronous VP1640A",  price: 129755 },
];

// Power supply (all models)
export const POWER_SUPPLY_PRICE = 1450;
