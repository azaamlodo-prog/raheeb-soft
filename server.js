const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const HTML_FILE = path.join(__dirname, "raheeb-soft.html");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
        purchase: 1,
        expense: 1,
        income: 1
    }
};

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(defaultDB, null, 2),
        "utf8"
    );
}

function readDB() {
    try {
        const db = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        return {
            ...defaultDB,
            ...db,
            company: {
                ...defaultDB.company,
                ...(db.company || {})
            },
            counters: {
                ...defaultDB.counters,
                ...(db.counters || {})
            }
        };
    } catch {
        return JSON.parse(
            JSON.stringify(defaultDB)
        );
    }
}

function saveDB(db) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(db, null, 2),
        "utf8"
    );
}

/* الصفحة الرئيسية */
app.get("/", (req, res) => {
    if (!fs.existsSync(HTML_FILE)) {
        return res.status(404).send(
            "ملف raheeb-soft.html غير موجود"
        );
    }

    res.sendFile(HTML_FILE);
});

/* حالة النظام */
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        system: "الرهيب سوفت",
        status: "working"
    });
});

/* قاعدة البيانات */
app.get("/api/database", (req, res) => {
    res.json(readDB());
});

/* المؤسسة */
app.get("/api/company", (req, res) => {
    res.json(readDB().company);
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

/* الأصناف */
app.get("/api/items", (req, res) => {
    res.json(readDB().items);
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

/* العملاء */
app.get("/api/customers", (req, res) => {
    res.json(readDB().customers);
});

app.post("/api/customers", (req, res) => {
    const db = readDB();

    const customer = {
        id: db.counters.customer++,
        name: req.body.name || "",
        phone: req.body.phone || "",
        address: req.body.address || ""
    };

    if (!customer.name) {
        return res.status(400).json({
            error: "اسم العميل مطلوب"
        });
    }

    db.customers.push(customer);
    saveDB(db);

    res.json({
        success: true,
        customer
    });
});

/* الموردون */
app.get("/api/suppliers", (req, res) => {
    res.json(readDB().suppliers);
});

app.post("/api/suppliers", (req, res) => {
    const db = readDB();

    const supplier = {
        id: db.counters.supplier++,
        name: req.body.name || "",
        phone: req.body.phone || "",
        address: req.body.address || ""
    };

    if (!supplier.name) {
        return res.status(400).json({
            error: "اسم المورد مطلوب"
        });
    }

    db.suppliers.push(supplier);
    saveDB(db);

    res.json({
        success: true,
        supplier
    });
});

/* المبيعات */
app.get("/api/sales", (req, res) => {
    res.json(readDB().sales);
});

app.post("/api/sales", (req, res) => {
    const db = readDB();
    const items = Array.isArray(req.body.items)
        ? req.body.items
        : [];

    if (!items.length) {
        return res.status(400).json({
            error: "الفاتورة فارغة"
        });
    }

    let total = 0;
    const invoiceItems = [];

    for (const x of items) {
        const item = db.items.find(
            i => i.id == x.itemId
        );

        if (!item) {
            return res.status(400).json({
                error: "الصنف غير موجود"
            });
        }

        const quantity = Number(x.quantity) || 0;
        const price = Number(x.price) || 0;
        const discount = Number(x.discount) || 0;

        if (quantity <= 0) {
            return res.status(400).json({
                error: "الكمية غير صحيحة"
            });
        }

        if (
            quantity >
            Number(item.quantity || 0)
        ) {
            return res.status(400).json({
                error:
                    "الكمية غير متوفرة للصنف " +
                    item.name
            });
        }

        const lineTotal =
            quantity * price - discount;

        total += lineTotal;

        invoiceItems.push({
            itemId: item.id,
            name: item.name,
            quantity,
            price,
            discount,
            total: lineTotal
        });
    }

    for (const x of invoiceItems) {
        const item = db.items.find(
            i => i.id === x.itemId
        );

        if (item) {
            item.quantity -= x.quantity;
        }
    }

    const invoiceId =
