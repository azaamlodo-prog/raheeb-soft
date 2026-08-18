const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

app.use(express.json({ limit: "5mb" }));

function emptyDB() {
  return {
    company: {
      name: "الرهيب سوفت",
      currency: "ريال"
    },
    products: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    cash: []
  };
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const db = emptyDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }

    const raw = fs.readFileSync(DB_FILE, "utf8").trim();

    if (!raw) return emptyDB();

    const db = JSON.parse(raw);
    const base = emptyDB();

    return {
      ...base,
      ...db,
      company: { ...base.company, ...(db.company || {}) },
      products: Array.isArray(db.products) ? db.products : [],
      customers: Array.isArray(db.customers) ? db.customers : [],
      suppliers: Array.isArray(db.suppliers) ? db.suppliers : [],
      sales: Array.isArray(db.sales) ? db.sales : [],
      purchases: Array.isArray(db.purchases) ? db.purchases : [],
      expenses: Array.isArray(db.expenses) ? db.expenses : [],
      cash: Array.isArray(db.cash) ? db.cash : []
    };
  } catch (error) {
    console.error(error);
    return emptyDB();
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

app.get("/", (req, res) => {
  res.sendFile(HTML_FILE);
});

app.get("/api/database", (req, res) => {
  res.json({
    success: true,
    data: readDB()
  });
});

app.post("/api/database", (req, res) => {
  try {
    saveDB(req.body);

    res.json({
      success: true,
      message: "تم حفظ البيانات"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("الرهيب سوفت يعمل على المنفذ " + PORT);
});
