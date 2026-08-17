const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "database.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const defaultDB = {
    company: {
        name: "الرهيب سوفت",
        phone: "",
        address: "",
        taxNumber: "",
        currency: "ر.س"
    },

    items: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    incomes: [],

    cash: 0,

    counters: {
        item: 1,
        customer: 1,
        supplier: 1,
        sale: 1,
        purchase: 1
    }
};

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(defaultDB, null, 2),
        "utf8"
    );
}

function readDB() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch (error) {
        return JSON.parse(
            JSON.stringify(defaultDB)
        );
    }
}

function saveDB(db) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(db, null, 2),
        "utf8"
    );
}

/* =========================
   اختبار النظام
========================= */

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        system: "الرهيب سوفت",
        status: "working"
    });
});

/* =========================
   قاعدة البيانات
========================= */

app.get("/api/database", (req, res) => {
    res.json(readDB());
});

/* =========================
   بيانات المؤسسة
========================= */

app.get("/api/company", (req, res) => {
    const db = readDB();
    res.json(db.company);
});

app.put("/api/company", (req, res) => {
    const db = readDB();

    db.company = {
        ...db.company,
        ...req.body
    };

    saveDB(db);

    res.json({
        success: true,
        company: db.company
    });
});

/* =========================
   الأصناف
========================= */

app.get("/api/items", (req, res) => {
    const db = readDB();
    res.json(db.items);
});

app.post("/api/items", (req, res) => {

    const db = readDB();

    const item = {
        id: db.counters.item++,
        name: req.body.name || "",
        barcode: req.body.barcode || "",
        category: req.body.category || "عام",
        unit: req.body.unit || "حبة",
        purchasePrice: Number(req.body.purchasePrice) || 0,
        salePrice: Number(req.body.salePrice) || 0,
        quantity: Number(req.body.quantity) || 0
    };

    if (!item.name) {
        return res.status(400).json({
            error: "اسم الصنف مطلوب"
        });
    }

    db.items.push(item);

    saveDB(db);

    res.json({
        success: true,
        item
    });
});

app.delete("/api/items/:id", (req, res) =>
