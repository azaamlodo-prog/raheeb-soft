const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ===============================
// الملفات
// ===============================

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ===============================
// قاعدة البيانات الافتراضية
// ===============================

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

// ===============================
// إنشاء قاعدة البيانات
// ===============================

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(defaultDB, null, 2),
        "utf8"
    );
}

// ===============================
// قراءة وحفظ قاعدة البيانات
// ===============================

function readDB() {
    try {
        const data = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        return {
            ...defaultDB,
            ...data,
            company: {
                ...defaultDB.company,
                ...(data.company || {})
            },
            counters: {
                ...defaultDB.counters,
                ...(data.counters || {})
            }
        };
    } catch (error) {
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

// ===============================
// الصفحة الرئيسية
// ===============================

app.get("/", (req, res) => {
    const file = path.join(
        PUBLIC_DIR,
        "raheeb-soft.html"
    );

    if (!fs.existsSync(file)) {
        return res.status(404).send(`
            <h1>ملف النظام غير موجود</h1>
            <p>
            تأكد أن ملف raheeb-soft.html موجود داخل مجلد public
            </p>
        `);
    }

    res.sendFile(file);
});

// ===============================
// الملفات الثابتة
// ===============================

app.use(
    express.static(PUBLIC_DIR)
);

// ===============================
// حالة النظام
// ===============================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        system: "الرهيب سوفت",
        status: "working",
        port: PORT
    });
});

// ===============================
// قاعدة البيانات
// ===============================

app.get("/api/database", (req, res) => {
    res.json(readDB());
});

// ===============================
// المؤسسة
// ===============================

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

// ===============================
// الأصناف
// ===============================

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
        purchasePrice:
            Number(req.body.purchasePrice) || 0,
        salePrice:
            Number(req.body.salePrice) || 0,
        quantity:
            Number(req.body.quantity) || 0
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

app.put("/api/items/:id", (req, res) => {
    const db = readDB();

    const id = Number(req.params.id);

    const item = db.items.find(
        x => x.id === id
    );

    if (!item) {
        return res.status(404).json({
            error: "الصنف غير موجود"
        });
    }

    Object.assign(item, {
        ...req.body,
        id: item.id
    });

    saveDB(db);

    res.json({
        success: true,
        item
    });
});

app.delete("/api/items/:id", (req, res) => {
    const db = readDB();

    const id = Number(req.params.id);

    const index = db.items.findIndex(
        x => x.id === id
    );

    if (index === -1) {
        return res.status(404).json({
            error: "الصنف غير موجود"
        });
    }

    db.items.splice(index, 1);

    saveDB(db);

    res.json({
        success: true
    });
});

// ===============================
// العملاء
// ===============================

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

app.delete("/api/customers/:id", (req, res) => {
    const db = readDB();

    const id = Number(req.params.id);

    db.customers =
        db.customers.filter(
            x => x.id !== id
        );

    saveDB(db);

    res.json({
        success: true
    });
});

// ===============================
// الموردون
// ===============================

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

app.delete("/api/suppliers/:id", (req, res) => {
    const db = readDB();

    const id = Number(req.params.id);

    db.suppliers =
        db.suppliers.filter(
            x => x.id !== id
        );

    saveDB(db);

    res.json({
        success: true
    });
});

// ===============================
// المبيعات
// ===============================

app.get("/api/sales", (req, res) => {
    const db = readDB();

    res.json(db.sales);
});

app.post("/api/sales", (req, res) => {
    const db = readDB();

    const items =
        Array.isArray(req.body.items)
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
                error:
                    "الصنف غير موجود: " +
                    (x.name || "")
            });
        }

        const quantity =
            Number(x.quantity) || 0;

        const price =
            Number(x.price) || 0;

        const discount =
            Number(x.discount) || 0;

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

    // خصم الكميات
    for (const x of invoiceItems) {

        const item = db.items.find(
            i => i.id === x.itemId
        );

        if (item) {
            item.quantity =
                Number(item.quantity || 0)
                - x.quantity;
        }
    }

    const invoice = {
        id: db.counters.sale++,

        number:
            "INV-" +
            String(
                db.counters.sale - 1
            ).padStart(5, "0"),

        date:
            new Date().toISOString(),

        customerId:
            req.body.customerId || null,

        payment:
            req.body.payment || "نقدي",

        total,

        items: invoiceItems
    };

    db.sales.push(invoice);

    if (invoice.payment === "نقدي") {
        db.cash =
            Number(db.cash || 0) +
            total;
    }

    saveDB(db);

    res.json({
        success: true,
        invoice
    });
});

// ===============================
// المشتريات
// ===============================

app.get("/api/purchases", (req, res) => {
    const db = readDB();

    res.json(db.purchases);
});

app.post("/api/purchases", (req, res) => {
    const db = readDB();

    const items =
        Array.isArray(req.body.items)
            ? req.body.items
            : [];

    if (!items.length) {
        return res.status(400).json({
            error: "فاتورة الشراء فارغة"
        });
    }

    let total = 0;

    const purchaseItems = [];

    for (const x of items) {

        const item = db.items.find(
            i => i.id == x.itemId
        );

        if (!item) {
            return res.status(400).json({
                error: "الصنف غير موجود"
            });
        }

        const quantity =
            Number(x.quantity) || 0;

        const price =
            Number(x.price) || 0;

        if (quantity <= 0) {
            return res.status(400).json({
                error: "الكمية غير صحيحة"
            });
        }

        const lineTotal =
            quantity * price;

        total += lineTotal;

        purchaseItems.push({
            itemId: item.id,
            name: item.name,
            quantity,
            price,
            total: lineTotal
        });
    }

    // زيادة المخزون
    for (const x of purchaseItems) {

        const item = db.items.find(
            i => i.id === x.itemId
        );

        if (item) {
            item.quantity =
                Number(item.quantity || 0) +
                x.quantity;
        }
    }

    const purchase = {
        id: db.counters.purchase++,

        number:
            "PUR-" +
            String(
                db.counters.purchase - 1
            ).padStart(5, "0"),

        date:
            new Date().toISOString(),

        supplierId:
            req.body.supplierId || null,

        payment:
            req.body.payment || "نقدي",

        total,

        items: purchaseItems
    };

    db.purchases.push(purchase);

    saveDB(db);

    res.json({
        success: true,
        purchase
    });
});

// ===============================
// المصروفات
// ===============================

app.get("/api/expenses", (req, res) => {
    const db = readDB();

    res.json(db.expenses);
});

app.post("/api/expenses", (req, res) => {
    const db = readDB();

    const amount =
        Number(req.body.amount) || 0;

    if (!req.body.name) {
        return res.status(400).json({
            error: "اسم المصروف مطلوب"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            error: "المبلغ غير صحيح"
        });
    }

    const expense = {
        id: db.counters.expense++,
        name: req.body.name,
        amount,
        note: req.body.note || "",
        date: new Date().toISOString()
    };

    db.expenses.push(expense);

    db.cash =
        Number(db.cash || 0) -
        amount;

    saveDB(db);

    res.json({
        success: true,
        expense
    });
});

// ===============================
// الإيرادات
// ===============================

app.get("/api/incomes", (req, res) => {
    const db = readDB();

    res.json(db.incomes);
});

app.post("/api/incomes", (req, res) => {
    const db = readDB();

    const amount =
        Number(req.body.amount) || 0;

    if (!req.body.name) {
        return res.status(400).json({
            error: "اسم الإيراد مطلوب"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            error: "المبلغ غير صحيح"
        });
    }

    const income = {
        id: db.counters.income++,
        name: req.body.name,
        amount,
        note: req.body.note || "",
        date: new Date().toISOString()
    };

    db.incomes.push(income);

    db.cash =
        Number(db.cash || 0) +
        amount;

    saveDB(db);

    res.json({
        success: true,
        income
    });
});

// ===============================
// النسخة الاحتياطية
// ===============================

app.get("/api/backup", (req, res) => {

    const db = readDB();

    const filename =
        "raheeb-soft-backup-" +
        new Date()
            .toISOString()
            .slice(0, 10) +
        ".json";

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
    );

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    res.send(
        JSON.stringify(
            db,
            null,
            2
        )
    );
});

// ===============================
// أي رابط غير API يرجع الواجهة
// ===============================

app.get("*", (req, res) => {

    if (
        req.path.startsWith("/api/")
    ) {
        return res.status(404).json({
            error: "API غير موجود"
        });
    }

    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "raheeb-soft.html"
        )
    );
});

// ===============================
// تشغيل السيرفر
// ===============================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        "الرهيب سوفت يعمل على المنفذ " +
        PORT
    );

});
