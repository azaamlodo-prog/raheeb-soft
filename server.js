const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

app.use(express.json({ limit: "20mb" }));

function defaultDatabase() {
  return {
    settings: {
      companyName: "الرهيب سوفت",
      taxNumber: "",
      phone: "",
      address: "",
      currency: "ريال",
      taxEnabled: true,
      taxRate: 15,
      invoicePrefix: "INV",
      invoiceStart: 1,
      printer: "80mm",
      invoiceTemplate: "thermal80",
      copies: 1
    },

    users: [],

    products: [],

    categories: [],

    customers: [],

    suppliers: [],

    invoices: [],

    purchases: [],

    expenses: [],

    receipts: [],

    payments: [],

    cashSessions: [],

    suspendedInvoices: [],

    counters: {
      invoice: 1,
      purchase: 1,
      receipt: 1,
      payment: 1
    }
  };
}

function ensureDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const db = defaultDatabase();

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(db, null, 2),
      "utf8"
    );

    return db;
  }

  try {
    const db = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

    const defaults = defaultDatabase();

    return {
      ...defaults,
      ...db,
      settings: {
        ...defaults.settings,
        ...(db.settings || {})
      },
      counters: {
        ...defaults.counters,
        ...(db.counters || {})
      }
    };
  } catch {
    const db = defaultDatabase();

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(db, null, 2),
      "utf8"
    );

    return db;
  }
}

function saveDatabase(db) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(db, null, 2),
    "utf8"
  );
}

app.get("/", (req, res) => {
  res.sendFile(HTML_FILE);
});

app.get("/api/database", (req, res) => {
  try {
    const db = ensureDatabase();

    res.json({
      success: true,
      data: db
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});

app.post("/api/database", (req, res) => {
  try {

    const incoming = req.body;
