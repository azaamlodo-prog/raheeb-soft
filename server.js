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

app.delete("/api/items/:id", (req, res) => {

    const db = readDB();

    db.items = db.items.filter(
        item => item.id != req.params.id
    );

    saveDB(db);

    res.json({
        success: true
    });
});

/* =========================
   العملاء
========================= */

app.get("/api/customers", (req, res) => {
    const db = readDB();
    res.json(db.customers);
});

app.post("/api/customers", (req, res) => {

    const db = readDB();

    const customer = {
        id: db.counters.customer++,
        name: req.body.name || "",
        phone: req.body.phone || "",
        address: req.body.address || "",
        balance: Number(req.body.balance) || 0
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

app.delete("/api/customers/:id", (req, res) => {

    const db = readDB();

    db.customers = db.customers.filter(
        customer => customer.id != req.params.id
    );

    saveDB(db);

    res.json({
        success: true
    });
});

/* =========================
   الموردون
========================= */

app.get("/api/suppliers", (req, res) => {
    const db = readDB();
    res.json(db.suppliers);
});

app.post("/api/suppliers", (req, res) => {

    const db = readDB();

    const supplier = {
        id: db.counters.supplier++,
        name: req.body.name || "",
        phone: req.body.phone || "",
        address: req.body.address || "",
        balance: Number(req.body.balance) || 0
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

app.delete("/api/suppliers/:id", (req, res) => {

    const db = readDB();

    db.suppliers = db.suppliers.filter(
        supplier => supplier.id != req.params.id
    );

    saveDB(db);

    res.json({
        success: true
    });
});

/* =========================
   المبيعات
========================= */

app.get("/api/sales", (req, res) => {

    const db = readDB();

    res.json(db.sales);
});

app.post("/api/sales", (req, res) => {

    const db = readDB();

    const cart = req.body.items || [];

    if (!cart.length) {
        return res.status(400).json({
            error: "الفاتورة فارغة"
        });
    }

    let total = 0;

    const invoiceItems = [];

    for (const line of cart) {

        const item = db.items.find(
            x => x.id == line.itemId
        );

        if (!item) {
            return res.status(400).json({
                error: "الصنف غير موجود"
            });
        }

        const quantity =
            Number(line.quantity) || 0;

        if (quantity <= 0) {
            return res.status(400).json({
                error: "الكمية غير صحيحة"
            });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({
                error:
                    "الكمية غير متوفرة للصنف: " +
                    item.name
            });
        }

        const price =
            Number(line.price) ||
            item.salePrice;

        const lineTotal =
            quantity * price;

        item.quantity -= quantity;

        total += lineTotal;

        invoiceItems.push({
            itemId: item.id,
            name: item.name,
            quantity,
            price,
            total: lineTotal
        });
    }

    const invoice = {

        id: db.counters.sale++,

        number:
            "INV-" +
            String(db.counters.sale).padStart(5, "0"),

        date: new Date().toISOString(),

        customerId:
            req.body.customerId || null,

        payment:
            req.body.payment || "نقدي",

        items: invoiceItems,

        total
    };

    db.sales.push(invoice);

    if (invoice.payment === "نقدي") {
        db.cash += total;
    }

    saveDB(db);

    res.json({
        success: true,
        invoice
    });
});

/* =========================
   المشتريات
========================= */

app.get("/api/purchases", (req, res) => {

    const db = readDB();

    res.json(db.purchases);
});

app.post("/api/purchases", (req, res) => {

    const db = readDB();

    const cart = req.body.items || [];

    if (!cart.length) {
        return res.status(400).json({
            error: "الفاتورة فارغة"
        });
    }

    let total = 0;

    const invoiceItems = [];

    for (const line of cart) {

        let item = db.items.find(
            x => x.id == line.itemId
        );

        if (!item) {

            item = {
                id: db.counters.item++,
                name: line.name || "صنف جديد",
                barcode: "",
                category: "عام",
                unit: "حبة",
                purchasePrice:
                    Number(line.price) || 0,
                salePrice:
                    Number(line.price) || 0,
                quantity: 0
            };

            db.items.push(item);
        }

        const quantity =
            Number(line.quantity) || 0;

        const price =
            Number(line.price) ||
            item.purchasePrice;

        const lineTotal =
            quantity * price;

        item.quantity += quantity;

        item.purchasePrice = price;

        total += lineTotal;

        invoiceItems.push({
            itemId: item.id,
            name: item.name,
            quantity,
            price,
            total: lineTotal
        });
    }

    const invoice = {

        id: db.counters.purchase++,

        number:
            "PUR-" +
            String(db.counters.purchase).padStart(5, "0"),

        date: new Date().toISOString(),

        supplierId:
            req.body.supplierId || null,

        payment:
            req.body.payment || "نقدي",

        items: invoiceItems,

        total
    };

    db.purchases.push(invoice);

    if (invoice.payment === "نقدي") {
        db.cash -= total;
    }

    saveDB(db);

    res.json({
        success: true,
        invoice
    });
});

/* =========================
   المصروفات
========================= */

app.get("/api/expenses", (req, res) => {

    const db = readDB();

    res.json(db.expenses);
});

app.post("/api/expenses", (req, res) => {

    const db = readDB();

    const amount =
        Number(req.body.amount) || 0;

    if (amount <= 0) {
        return res.status(400).json({
            error: "المبلغ غير صحيح"
        });
    }

    const expense = {

        id: Date.now(),

        name:
            req.body.name ||
            "مصروف",

        amount,

        note:
            req.body.note || "",

        date:
            new Date().toISOString()
    };

    db.expenses.push(expense);

    db.cash -= amount;

    saveDB(db);

    res.json({
        success: true,
        expense
    });
});

/* =========================
   الإيرادات
========================= */

app.get("/api/incomes", (req, res) => {

    const db = readDB();

    res.json(db.incomes);
});

app.post("/api/incomes", (req, res) => {

    const db = readDB();

    const amount =
        Number(req.body.amount) || 0;

    if (amount <= 0) {
        return res.status(400).json({
            error: "المبلغ غير صحيح"
        });
    }

    const income = {

        id: Date.now(),

        name:
            req.body.name ||
            "إيراد",

        amount,

        note:
            req.body.note || "",

        date:
            new Date().toISOString()
    };

    db.incomes.push(income);

    db.cash += amount;

    saveDB(db);

    res.json({
        success: true,
        income
    });
});

/* =========================
   الإحصائيات
========================= */

app.get("/api/dashboard", (req, res) => {

    const db = readDB();

    const sales =
        db.sales.reduce(
            (sum, x) => sum + x.total,
            0
        );

    const purchases =
        db.purchases.reduce(
            (sum, x) => sum + x.total,
            0
        );

    const stock =
        db.items.reduce(
            (sum, x) =>
                sum +
                x.quantity *
                x.salePrice,
            0
        );

    res.json({

        sales,

        purchases,

        stock,

        cash: db.cash,

        items: db.items.length,

        customers:
            db.customers.length,

        suppliers:
            db.suppliers.length
    });
});

/* =========================
   النسخ الاحتياطي
========================= */

app.get("/api/backup", (req, res) => {

    const db = readDB();

    res.setHeader(
        "Content-Disposition",
        'attachment; filename="raheeb-soft-backup.json"'
    );

    res.json(db);
});

/* =========================
   الواجهة
========================= */

app.get("*", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

/* =========================
   تشغيل السيرفر
========================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "الرهيب سوفت يعمل على المنفذ " +
            PORT
        );

    }
);
