const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

app.use(express.json({ limit: "10mb" }));

function getDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const database = {
      company: {
        name: "الرهيب سوفت",
        taxNumber: "",
        phone: "",
        address: "",
        currency: "ريال"
      },
      products: [],
      customers: [],
      suppliers: [],
      invoices: [],
      purchases: [],
      expenses: [],
      cashTransactions: []
    };

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(database, null, 2),
      "utf8"
    );

    return database;
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    return {
      company: {
        name: "الرهيب سوفت",
        taxNumber: "",
        phone: "",
        address: "",
        currency: "ريال"
      },
      products: [],
      customers: [],
      suppliers: [],
      invoices: [],
      purchases: [],
      expenses: [],
      cashTransactions: []
    };
  }
}

function saveDatabase(database) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(database, null, 2),
    "utf8"
  );
}

app.get("/", (req, res) => {
  res.sendFile(HTML_FILE);
});

app.get("/api/database", (req, res) => {
  res.json(getDatabase());
});

app.post("/api/database", (req, res) => {
  try {
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

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "الرهيب سوفت يعمل",
    port: PORT
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("الرهيب سوفت يعمل على المنفذ " + PORT);
});
