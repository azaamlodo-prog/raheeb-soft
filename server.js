const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

/* =========================================================
   إعدادات السيرفر
========================================================= */

const PORT = process.env.PORT || 10000;

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================================================
   إنشاء المجلدات والملف إذا لم تكن موجودة
========================================================= */

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* =========================================================
   قاعدة البيانات الافتراضية
========================================================= */

const DEFAULT_DATABASE = {
    settings: {
        companyName: "مؤسسة الرهيب",
        branch: "الفرع الرئيسي",
        address: "",
        phone: "",
        taxNumber: "",
        currency: "ريال سعودي",
        taxEnabled: true,
        taxRate: 15,
        invoicePrefix: "INV-",
        invoiceNumber: 1,
        purchaseNumber: 1,
        receiptNumber: 1,
        paymentNumber: 1,
        quoteNumber: 1
    },

    products: [],
    categories: [],
    units: [],

    warehouses: [
        {
            id: 1,
            name: "المخزن الرئيسي",
            code: "WH-001",
            active: true
        }
    ],

    customers: [],
    suppliers: [],

    sales: [],
    purchases: [],

    salesReturns: [],
    purchaseReturns: [],

    quotes: [],

    receipts: [],
    payments: [],

    expenses: [],
    income: [],

    cashSessions: [],

    stockMovements: [],

    users: [
        {
            id: 1,
            name: "مدير النظام",
            username: "admin",
            password: "admin",
            role: "admin",
            active: true
        }
    ],

    logs: [],

    counters: {
        product: 1,
        customer: 1,
        supplier: 1,
        category: 1,
        unit: 1,
        warehouse: 2,
        invoice: 1,
        purchase: 1,
        receipt: 1,
        payment: 1,
        expense: 1,
        income: 1,
        quote: 1,
        salesReturn: 1,
        purchaseReturn: 1,
        session: 1,
        user: 2
    }
};

/* =========================================================
   أدوات مساعدة
========================================================= */

function cloneDefaultDatabase() {
    return JSON.parse(JSON.stringify(DEFAULT_DATABASE));
}

function mergeDatabase(oldData) {
    const defaults = cloneDefaultDatabase();

    if (!oldData || typeof oldData !== "object") {
        return defaults;
    }

    const result = {
        ...defaults,
        ...oldData
    };

    Object.keys(defaults).forEach((key) => {
        if (
            Array.isArray(defaults[key]) &&
            !Array.isArray(result[key])
        ) {
            result[key] = defaults[key];
        }

        if (
            defaults[key] &&
            typeof defaults[key] === "object" &&
            !Array.isArray(defaults[key])
        ) {
            result[key] = {
                ...defaults[key],
                ...(result[key] || {})
            };
        }
    });

    return result;
}

function ensureDatabase() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const db = cloneDefaultDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        const text = fs.readFileSync(DB_FILE, "utf8");

        if (!text.trim()) {
            const db = cloneDefaultDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        const oldData = JSON.parse(text);
        const db = mergeDatabase(oldData);

        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(db, null, 2),
            "utf8"
        );

        return db;

    } catch (error) {

        console.error("خطأ في قراءة قاعدة البيانات:", error);

        const db = cloneDefaultDatabase();

        try {
            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );
        } catch (writeError) {
            console.error("خطأ في إنشاء قاعدة البيانات:", writeError);
        }

        return db;
    }
}

/* =========================================================
   تحميل قاعدة البيانات
========================================================= */

let database = ensureDatabase();

/* =========================================================
   حفظ قاعدة البيانات
========================================================= */

function saveDatabase() {

    try {

        const tempFile = DB_FILE + ".tmp";

        fs.writeFileSync(
            tempFile,
            JSON.stringify(database, null, 2),
            "utf8"
        );

        fs.renameSync(tempFile, DB_FILE);

        return true;

    } catch (error) {

        console.error("خطأ أثناء حفظ قاعدة البيانات:", error);

        return false;
    }
}

/* =========================================================
   إنشاء رقم تلقائي
========================================================= */

function nextId(collectionName, counterName) {

    if (!database.counters) {
        database.counters = {};
    }

    if (!database.counters[counterName]) {
        database.counters[counterName] = 1;
    }

    const id = database.counters[counterName];

    database.counters[counterName]++;

    return id;
}

/* =========================================================
   رقم فاتورة
========================================================= */

function generateInvoiceNumber() {

    const prefix =
        database.settings.invoicePrefix || "INV-";

    const number =
        database.counters.invoice || 1;

    database.counters.invoice++;

    return (
        prefix +
        String(number).padStart(6, "0")
    );
}

/* =========================================================
   سجل العمليات
========================================================= */

function addLog(action, details = {}) {

    if (!Array.isArray(database.logs)) {
        database.logs = [];
    }

    database.logs.push({
        id: nextId("logs", "log"),
        action,
        details,
        date: new Date().toISOString()
    });

    if (database.logs.length > 5000) {
        database.logs =
            database.logs.slice(-5000);
    }
}

/* =========================================================
   الصفحة الرئيسية
========================================================= */

app.get("/", (req, res) => {

    const htmlFile =
        path.join(PUBLIC_DIR, "raheeb-soft.html");

    if (fs.existsSync(htmlFile)) {

        return res.sendFile(htmlFile);
    }

    res.status(404).send(`
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>الرهيب سوفت PRO</title>
        </head>
        <body style="font-family:Tahoma;text-align:center;padding:50px">
            <h1>الرهيب سوفت PRO</h1>
            <p>ملف raheeb-soft.html غير موجود داخل مجلد public.</p>
        </body>
        </html>
    `);
});

/* =========================================================
   الملفات الثابتة
========================================================= */

app.use(
    express.static(PUBLIC_DIR)
);

/* =========================================================
   API - حالة السيرفر
========================================================= */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        system: "الرهيب سوفت PRO",
        status: "online",
        time: new Date().toISOString(),
        database: true
    });
});

/* =========================================================
   API - قراءة قاعدة البيانات كاملة
========================================================= */

app.get("/api/database", (req, res) => {

    try {

        database = ensureDatabase();

        res.json({
            success: true,
            data: database
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "تعذر قراءة قاعدة البيانات"
        });
    }
});

/* =========================================================
   API - اختصار للحصول على البيانات
========================================================= */

app.get("/api/data", (req, res) => {

    res.json({
        success: true,
        data: database
    });
});

/* =========================================================
   API - حفظ قاعدة البيانات كاملة
========================================================= */

app.post("/api/database", (req, res) => {

    try {

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "لم يتم إرسال البيانات"
            });
        }

        database = mergeDatabase(req.body);

        addLog("تحديث قاعدة البيانات");

        const saved = saveDatabase();

        if (!saved) {
            return res.status(500).json({
                success: false,
                message: "فشل حفظ البيانات"
            });
        }

        res.json({
            success: true,
            message: "تم حفظ البيانات بنجاح",
            data: database
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء حفظ البيانات",
            error: error.message
        });
    }
});

/* =========================================================
   API - حفظ جزئي
========================================================= */

app.patch("/api/database", (req, res) => {

    try {

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "لا توجد بيانات"
            });
        }

        database = mergeDatabase({
            ...database,
            ...req.body
        });

        addLog("تعديل بيانات");

        if (!saveDatabase()) {
            return res.status(500).json({
                success: false,
                message: "فشل حفظ البيانات"
            });
        }

        res.json({
            success: true,
            message: "تم الحفظ",
            data: database
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "خطأ أثناء الحفظ",
            error: error.message
        });
    }
});

/* =========================================================
   API - الإعدادات
========================================================= */

app.get("/api/settings", (req, res) => {

    res.json({
        success: true,
        data: database.settings
    });
});

app.put("/api/settings", (req, res) => {

    try {

        database.settings = {
            ...database.settings,
            ...(req.body || {})
        };

        addLog("تعديل الإعدادات");

        saveDatabase();

        res.json({
            success: true,
            data: database.settings
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر حفظ الإعدادات"
        });
    }
});

/* =========================================================
   API - المنتجات
========================================================= */

app.get("/api/products", (req, res) => {

    res.json({
        success: true,
        data: database.products
    });
});

app.post("/api/products", (req, res) => {

    try {

        const product = {
            ...req.body,
            id: req.body.id || nextId(
                "products",
                "product"
            ),
            createdAt:
                req.body.createdAt ||
                new Date().toISOString(),
            updatedAt:
                new Date().toISOString()
        };

        database.products.push(product);

        addLog("إضافة منتج", {
            id: product.id,
            name: product.name
        });

        saveDatabase();

        res.json({
            success: true,
            data: product
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر إضافة المنتج",
            error: error.message
        });
    }
});

app.put("/api/products/:id", (req, res) => {

    const id = String(req.params.id);

    const index =
        database.products.findIndex(
            item => String(item.id) === id
        );

    if (index === -1) {

        return res.status(404).json({
            success: false,
            message: "المنتج غير موجود"
        });
    }

    database.products[index] = {
        ...database.products[index],
        ...req.body,
        id: database.products[index].id,
        updatedAt: new Date().toISOString()
    };

    saveDatabase();

    res.json({
        success: true,
        data: database.products[index]
    });
});

app.delete("/api/products/:id", (req, res) => {

    const id = String(req.params.id);

    const oldLength =
        database.products.length;

    database.products =
        database.products.filter(
            item => String(item.id) !== id
        );

    if (
        database.products.length === oldLength
    ) {

        return res.status(404).json({
            success: false,
            message: "المنتج غير موجود"
        });
    }

    addLog("حذف منتج", { id });

    saveDatabase();

    res.json({
        success: true,
        message: "تم حذف المنتج"
    });
});

/* =========================================================
   API - العملاء
========================================================= */

app.get("/api/customers", (req, res) => {

    res.json({
        success: true,
        data: database.customers
    });
});

app.post("/api/customers", (req, res) => {

    const customer = {
        ...req.body,
        id: req.body.id || nextId(
            "customers",
            "customer"
        ),
        createdAt: new Date().toISOString()
    };

    database.customers.push(customer);

    addLog("إضافة عميل", {
        id: customer.id,
        name: customer.name
    });

    saveDatabase();

    res.json({
        success: true,
        data: customer
    });
});

app.put("/api/customers/:id", (req, res) => {

    const id = String(req.params.id);

    const index =
        database.customers.findIndex(
            item => String(item.id) === id
        );

    if (index === -1) {

        return res.status(404).json({
            success: false,
            message: "العميل غير موجود"
        });
    }

    database.customers[index] = {
        ...database.customers[index],
        ...req.body,
        id: database.customers[index].id,
        updatedAt: new Date().toISOString()
    };

    saveDatabase();

    res.json({
        success: true,
        data: database.customers[index]
    });
});

app.delete("/api/customers/:id", (req, res) => {

    const id = String(req.params.id);

    database.customers =
        database.customers.filter(
            item => String(item.id) !== id
        );

    saveDatabase();

    res.json({
        success: true,
        message: "تم حذف العميل"
    });
});

/* =========================================================
   API - الموردين
========================================================= */

app.get("/api/suppliers", (req, res) => {

    res.json({
        success: true,
        data: database.suppliers
    });
});

app.post("/api/suppliers", (req, res) => {

    const supplier = {
        ...req.body,
        id: req.body.id || nextId(
            "suppliers",
            "supplier"
        ),
        createdAt: new Date().toISOString()
    };

    database.suppliers.push(supplier);

    addLog("إضافة مورد", {
        id: supplier.id,
        name: supplier.name
    });

    saveDatabase();

    res.json({
        success: true,
        data: supplier
    });
});

app.put("/api/suppliers/:id", (req, res) => {

    const id = String(req.params.id);

    const index =
        database.suppliers.findIndex(
            item => String(item.id) === id
        );

    if (index === -1) {

        return res.status(404).json({
            success: false,
            message: "المورد غير موجود"
        });
    }

    database.suppliers[index] = {
        ...database.suppliers[index],
        ...req.body,
        id: database.suppliers[index].id,
        updatedAt: new Date().toISOString()
    };

    saveDatabase();

    res.json({
        success: true,
        data: database.suppliers[index]
    });
});

app.delete("/api/suppliers/:id", (req, res) => {

    const id = String(req.params.id);

    database.suppliers =
        database.suppliers.filter(
            item => String(item.id) !== id
        );

    saveDatabase();

    res.json({
        success: true,
        message: "تم حذف المورد"
    });
});

/* =========================================================
   API - المبيعات
========================================================= */

app.get("/api/sales", (req, res) => {

    res.json({
        success: true,
        data: database.sales
    });
});

app.post("/api/sales", (req, res) => {

    try {

        const sale = {
            ...req.body,

            id:
                req.body.id ||
                nextId("sales", "invoice"),

            invoiceNumber:
                req.body.invoiceNumber ||
                generateInvoiceNumber(),

            date:
                req.body.date ||
                new Date().toISOString(),

            createdAt:
                new Date().toISOString()
        };

        database.sales.push(sale);

        /* تحديث المخزون */

        if (Array.isArray(sale.items)) {

            sale.items.forEach(item => {

                const product =
                    database.products.find(
                        p =>
                            String(p.id) ===
                            String(item.productId)
                    );

                if (product) {

                    const qty =
                        Number(item.quantity) || 0;

                    product.stock =
                        Number(product.stock || 0) - qty;

                    database.stockMovements.push({

                        id: nextId(
                            "stockMovements",
                            "stockMovement"
                        ),

                        productId:
                            product.id,

                        type: "sale",

                        quantity: -qty,

                        reference:
                            sale.invoiceNumber,

                        date:
                            new Date().toISOString()
                    });
                }
            });
        }

        addLog("إضافة فاتورة مبيعات", {
            id: sale.id,
            invoiceNumber:
                sale.invoiceNumber
        });

        saveDatabase();

        res.json({
            success: true,
            data: sale
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر حفظ فاتورة المبيعات",
            error: error.message
        });
    }
});

/* =========================================================
   API - المشتريات
========================================================= */

app.get("/api/purchases", (req, res) => {

    res.json({
        success: true,
        data: database.purchases
    });
});

app.post("/api/purchases", (req, res) => {

    try {

        const purchase = {
            ...req.body,

            id:
                req.body.id ||
                nextId("purchases", "purchase"),

            purchaseNumber:
                req.body.purchaseNumber ||
                "PUR-" +
                String(
                    database.counters.purchase++
                ).padStart(6, "0"),

            date:
                req.body.date ||
                new Date().toISOString(),

            createdAt:
                new Date().toISOString()
        };

        database.purchases.push(purchase);

        /* زيادة المخزون */

        if (Array.isArray(purchase.items)) {

            purchase.items.forEach(item => {

                const product =
                    database.products.find(
                        p =>
                            String(p.id) ===
                            String(item.productId)
                    );

                if (product) {

                    const qty =
                        Number(item.quantity) || 0;

                    product.stock =
                        Number(product.stock || 0) + qty;

                    if (
                        item.purchasePrice !==
                        undefined
                    ) {

                        product.purchasePrice =
                            Number(
                                item.purchasePrice
                            );
                    }

                    database.stockMovements.push({

                        id: nextId(
                            "stockMovements",
                            "stockMovement"
                        ),

                        productId:
                            product.id,

                        type: "purchase",

                        quantity: qty,

                        reference:
                            purchase.purchaseNumber,

                        date:
                            new Date().toISOString()
                    });
                }
            });
        }

        addLog("إضافة فاتورة مشتريات", {
            id: purchase.id
        });

        saveDatabase();

        res.json({
            success: true,
            data: purchase
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر حفظ فاتورة المشتريات",
            error: error.message
        });
    }
});

/* =========================================================
   API عام لأي مجموعة
========================================================= */

const COLLECTIONS = [

    "products",
    "customers",
    "suppliers",
    "sales",
    "purchases",
    "salesReturns",
    "purchaseReturns",
    "quotes",
    "receipts",
    "payments",
    "expenses",
    "income",
    "cashSessions",
    "stockMovements",
    "users",
    "logs",
    "categories",
    "units",
    "warehouses"

];

COLLECTIONS.forEach(collection => {

    app.get(`/api/${collection}`, (req, res) => {

        res.json({
            success: true,
            data: database[collection] || []
        });
    });

});

/* =========================================================
   API - إضافة عملية لأي مجموعة
========================================================= */

app.post("/api/:collection", (req, res) => {

    const collection = req.params.collection;

    if (!COLLECTIONS.includes(collection)) {

        return res.status(404).json({
            success: false,
            message: "المجموعة غير موجودة"
        });
    }

    try {

        if (!Array.isArray(database[collection])) {
            database[collection] = [];
        }

        const item = {
            ...req.body,

            id:
                req.body.id ||
                Date.now(),

            createdAt:
                req.body.createdAt ||
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        database[collection].push(item);

        addLog(
            `إضافة سجل في ${collection}`,
            { id: item.id }
        );

        saveDatabase();

        res.json({
            success: true,
            data: item
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر حفظ العملية",
            error: error.message
        });
    }
});

/* =========================================================
   API - حذف عنصر
========================================================= */

app.delete(
    "/api/:collection/:id",
    (req, res) => {

        const collection =
            req.params.collection;

        const id =
            String(req.params.id);

        if (
            !COLLECTIONS.includes(collection)
        ) {

            return res.status(404).json({
                success: false,
                message: "المجموعة غير موجودة"
            });
        }

        if (
            !Array.isArray(database[collection])
        ) {

            return res.status(404).json({
                success: false,
                message: "المجموعة غير صالحة"
            });
        }

        const oldLength =
            database[collection].length;

        database[collection] =
            database[collection].filter(
                item =>
                    String(item.id) !== id
            );

        if (
            database[collection].length ===
            oldLength
        ) {

            return res.status(404).json({
                success: false,
                message: "العنصر غير موجود"
            });
        }

        addLog(
            `حذف سجل من ${collection}`,
            { id }
        );

        saveDatabase();

        res.json({
            success: true,
            message: "تم الحذف بنجاح"
        });
    }
);

/* =========================================================
   API - تعديل عنصر
========================================================= */

app.put(
    "/api/:collection/:id",
    (req, res) => {

        const collection =
            req.params.collection;

        const id =
            String(req.params.id);

        if (
            !COLLECTIONS.includes(collection)
        ) {

            return res.status(404).json({
                success: false,
                message: "المجموعة غير موجودة"
            });
        }

        const index =
            database[collection].findIndex(
                item =>
                    String(item.id) === id
            );

        if (index === -1) {

            return res.status(404).json({
                success: false,
                message: "العنصر غير موجود"
            });
        }

        database[collection][index] = {

            ...database[collection][index],

            ...req.body,

            id:
                database[collection][index].id,

            updatedAt:
                new Date().toISOString()
        };

        addLog(
            `تعديل سجل في ${collection}`,
            { id }
        );

        saveDatabase();

        res.json({
            success: true,
            data:
                database[collection][index]
        });
    }
);

/* =========================================================
   API - النسخ الاحتياطي
========================================================= */

app.get("/api/backup", (req, res) => {

    try {

        database = ensureDatabase();

        const fileName =
            "raheeb-soft-backup-" +
            new Date()
                .toISOString()
                .replace(/[:.]/g, "-") +
            ".json";

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.setHeader(
            "Content-Type",
            "application/json; charset=utf-8"
        );

        res.send(
            JSON.stringify(
                database,
                null,
                2
            )
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر إنشاء النسخة الاحتياطية"
        });
    }
});

/* =========================================================
   API - استعادة نسخة احتياطية
========================================================= */

app.post("/api/restore", (req, res) => {

    try {

        if (!req.body) {

            return res.status(400).json({
                success: false,
                message: "لم يتم إرسال النسخة الاحتياطية"
            });
        }

        database =
            mergeDatabase(req.body);

        addLog("استعادة نسخة احتياطية");

        saveDatabase();

        res.json({
            success: true,
            message: "تمت استعادة النسخة الاحتياطية",
            data: database
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "فشل استعادة النسخة الاحتياطية",
            error: error.message
        });
    }
});

/* =========================================================
   API - رقم الفاتورة التالي
========================================================= */

app.get(
    "/api/next-invoice-number",
    (req, res) => {

        const prefix =
            database.settings.invoicePrefix ||
            "INV-";

        const number =
            database.counters.invoice || 1;

        res.json({
            success: true,

            number:
                prefix +
                String(number)
                    .padStart(6, "0")
        });
    }
);

/* =========================================================
   API - إحصائيات لوحة التحكم
========================================================= */

app.get("/api/dashboard", (req, res) => {

    try {

        const sales =
            Array.isArray(database.sales)
                ? database.sales
                : [];

        const purchases =
            Array.isArray(database.purchases)
                ? database.purchases
                : [];

        const products =
            Array.isArray(database.products)
                ? database.products
                : [];

        const customers =
            Array.isArray(database.customers)
                ? database.customers
                : [];

        const suppliers =
            Array.isArray(database.suppliers)
                ? database.suppliers
                : [];

        const expenses =
            Array.isArray(database.expenses)
                ? database.expenses
                : [];

        const totalSales =
            sales.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.total ||
                        item.grandTotal ||
                        item.amount ||
                        0
                    ),
                0
            );

        const totalPurchases =
            purchases.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.total ||
                        item.grandTotal ||
                        item.amount ||
                        0
                    ),
                0
            );

        const totalExpenses =
            expenses.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.amount ||
                        item.total ||
                        0
                    ),
                0
            );

        const stockValue =
            products.reduce(
                (sum, product) =>
                    sum +
                    (
                        Number(product.stock || 0) *
                        Number(
                            product.purchasePrice || 0
                        )
                    ),
                0
            );

        res.json({

            success: true,

            data: {

                salesCount:
                    sales.length,

                purchasesCount:
                    purchases.length,

                productsCount:
                    products.length,

                customersCount:
                    customers.length,

                suppliersCount:
                    suppliers.length,

                totalSales,

                totalPurchases,

                totalExpenses,

                stockValue,

                estimatedProfit:
                    totalSales -
                    totalPurchases -
                    totalExpenses
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "تعذر تحميل الإحصائيات"
        });
    }
});

/* =========================================================
   معالجة الأخطاء
========================================================= */

app.use((err, req, res, next) => {

    console.error(
        "SERVER ERROR:",
        err
    );

    res.status(500).json({

        success: false,

        message:
            "حدث خطأ داخلي في السيرفر",

        error:
            process.env.NODE_ENV === "production"
                ? undefined
                : err.message
    });
});

/* =========================================================
   تشغيل السيرفر
========================================================= */

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        "======================================"
    );

    console.log(
        "الرهيب سوفت PRO يعمل بنجاح"
    );

    console.log(
        `PORT: ${PORT}`
    );

    console.log(
        `Database: ${DB_FILE}`
    );

    console.log(
        "======================================"
    );
});
