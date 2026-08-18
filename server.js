const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

app.use(express.json({ limit: "2mb" }));

function defaultDatabase() {
  return {
    products: [],
    customers: [],
    invoices: []
  };
}

function readDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const data = defaultDatabase();
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
      return data;
    }

    const text = fs.readFileSync(DATA_FILE, "utf8").trim();

    if (!text) {
      return defaultDatabase();
    }

    const data = JSON.parse(text);

    return {
      products: Array.isArray(data.products) ? data.products : [],
      customers: Array.isArray(data.customers) ? data.customers : [],
      invoices: Array.isArray(data.invoices) ? data.invoices : []
    };
  } catch (error) {
    console.error("Database error:", error.message);
    return defaultDatabase();
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/", (req, res) => {
  res.sendFile(HTML_FILE);
});

app.get("/api/database", (req, res) => {
  res.json({
    success: true,
    data: readDatabase()
  });
});

app.post("/api/database", (req, res) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({
        success: false,
        error: "بيانات غير صحيحة"
      });
    }

    saveDatabase({
      products: Array.isArray(data.products) ? data.products : [],
      customers: Array.isArray(data.customers) ? data.customers : [],
      invoices: Array.isArray(data.invoices) ? data.invoices : []
    });

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

app.listen(PORT, "0.0.0.0", () => {
  console.log("الرهيب سوفت يعمل على المنفذ " + PORT);
});
