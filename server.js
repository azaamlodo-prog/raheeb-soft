const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

app.use(express.json({ limit: "25mb" }));

function createDatabase() {
  return {
    settings: {
      companyName: "الرهيب سوفت",
      phone: "",
      address: "",
      taxNumber: "",
      currency: "ريال سعودي",
      taxEnabled: true,
      taxRate: 15,
      invoicePrefix: "INV-",
      nextInvoice: 1,
      logo: "",
      defaultPrinter: "80mm",
      invoiceTemplate: "thermal80",
      invoiceCopies: 1
    },

    users: [
      {
        id: 1,
        name: "المدير",
        username: "admin",
        role: "admin"
      }
    ],

    products: [],
    categories: [],
    warehouses: [],

    customers: [
      {
        id: 1,
        name: "عميل نقدي",
        phone: "",
        address: "",
        balance: 0
      }
    ],

    suppliers: [],

    invoices: [],
    purchases: [],
    salesReturns: [],
    purchaseReturns: [],

    expenses: [],
    receipts: [],
    payments: [],

    cashSessions: [],
    suspendedInvoices: [],

    stockMovements: [],

    counters: {
      product: 1,
      customer: 2,
      supplier: 1,
      invoice: 1,
      purchase: 1,
      expense: 1,
      receipt: 1,
      payment: 1,
      session: 1
    }
  };
}

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const db = createDatabase();

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(db, null, 2),
      "utf8"
    );

    return db;
  }

  try {
    const saved = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

    const fresh = createDatabase();

    return {
      ...fresh,
      ...saved,
      settings: {
        ...fresh.settings,
        ...(saved.settings || {})
      },
      counters: {
        ...fresh.counters,
        ...(saved.counters || {})
      }
    };

  } catch (error) {

    const db = createDatabase();

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(db, null, 2),
      "utf8"
    );

    return db;
  }
}

function saveDatabase(db) {

  const temporaryFile =
    DB_FILE + ".tmp";

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(
    temporaryFile,
    DB_FILE
  );
}


/* الصفحة الرئيسية */

app.get("/", (req, res) => {

  res.sendFile(HTML_FILE);

});


/* جلب قاعدة البيانات */

app.get("/api/database", (req, res) => {

  try {

    const db = loadDatabase();

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


/* حفظ قاعدة البيانات */

app.post("/api/database", (req, res) => {

  try {

    if (
      !req.body ||
      typeof req.body !== "object"
    ) {

      return res.status(400).json({
        success: false,
        error: "بيانات غير صحيحة"
      });

    }

    saveDatabase(req.body);

    res.json({
      success: true,
      message: "تم حفظ البيانات بنجاح"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


/* فحص النظام */

app.get("/api/health", (req, res) => {

  res.json({
    success: true,
    system: "Raheeb Soft PRO",
    status: "online",
    time: new Date().toISOString()
  });

});


/* رقم إصدار النظام */

app.get("/api/version", (req, res) => {

  res.json({
    name: "الرهيب سوفت PRO",
    version: "4.0.0"
  });

});


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "الرهيب سوفت PRO يعمل على المنفذ " +
      PORT
    );

  }
);
