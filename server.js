const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// المسارات
// ========================================

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

// ========================================
// Express
// ========================================

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));

app.use(express.static(__dirname));

// ========================================
// قاعدة بيانات جديدة
// ========================================

function createDatabase() {
    return {
        settings: {
            companyName: "مؤسسة الرهيب",
            branch: "الفرع الرئيسي",
            phone: "",
            address: "",
            taxNumber: "",
            currency: "ريال سعودي",
            taxEnabled: true,
            taxRate: 15,
            invoicePrefix: "INV-",
            nextInvoice: 1,
            nextPurchase: 1,
            nextReceipt: 1,
            nextPayment: 1,
            defaultPrinter: "80mm",
            invoiceTemplate: "thermal80",
            invoiceCopies: 1
        },

        users: [
            {
                id: 1,
                name: "المدير",
                username: "admin",
                role: "admin",
                active: true
            }
        ],

        products: [],
        categories: [],
        units: [],
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

        quotations: [],

        expenses: [],
        income: [],

        receipts: [],
        payments: [],

        stockMovements: [],

        cashSessions: [],

        suspendedInvoices: [],

        logs: [],

        counters: {
            product: 1,
            category: 1,
            unit: 1,
            warehouse: 1,

            customer: 2,
            supplier: 1,

            invoice: 1,
            purchase: 1,

            salesReturn: 1,
            purchaseReturn: 1,

            quotation: 1,

            expense: 1,
            income: 1,

            receipt: 1,
            payment: 1,

            stockMovement: 1,
            session: 1,

            log: 1
        }
    };
}

// ========================================
// توحيد قاعدة البيانات القديمة والجديدة
// ========================================

function normalizeDatabase(saved) {

    const fresh = createDatabase();

    if (!saved || typeof saved !== "object") {
        return fresh;
    }

    const db = {
        ...fresh,
        ...saved
    };

    db.settings = {
        ...fresh.settings,
        ...(saved.settings || {})
    };

    db.counters = {
        ...fresh.counters,
        ...(saved.counters || {})
    };

    const arrays = [
        "products",
        "categories",
        "units",
        "warehouses",
        "customers",
        "suppliers",
        "invoices",
        "purchases",
        "salesReturns",
        "purchaseReturns",
        "quotations",
        "expenses",
        "income",
        "receipts",
        "payments",
        "stockMovements",
        "cashSessions",
        "suspendedInvoices",
        "logs",
        "users"
    ];

    arrays.forEach(key => {
        if (!Array.isArray(db[key])) {
            db[key] = [];
        }
    });

    if (!db.customers.length) {
        db.customers = [...fresh.customers];
    }

    if (!db.users.length) {
        db.users = [...fresh.users];
    }

    return db;
}

// ========================================
// تحميل قاعدة البيانات
// ========================================

function loadDatabase() {

    try {

        if (!fs.existsSync(DB_FILE)) {

            const db = createDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        const content = fs.readFileSync(
            DB_FILE,
            "utf8"
        );

        if (!content.trim()) {

            const db = createDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        return normalizeDatabase(
            JSON.parse(content)
        );

    } catch (error) {

        console.error(
            "Database Load Error:",
            error.message
        );

        return createDatabase();
    }
}

// ========================================
// حفظ قاعدة البيانات
// ========================================

function saveDatabase(db) {

    const normalized = normalizeDatabase(db);

    const temp = DB_FILE + ".tmp";

    fs.writeFileSync(
        temp,
        JSON.stringify(normalized, null, 2),
        "utf8"
    );

    fs.renameSync(
        temp,
        DB_FILE
    );

    return normalized;
}

// ========================================
// الصفحة الرئيسية
// ========================================

app.get("/", (req, res) => {

    if (!fs.existsSync(HTML_FILE)) {

        return res.status(404).send(
            "ملف raheeb-soft.html غير موجود"
        );
    }

    res.sendFile(HTML_FILE);
});

// ========================================
// فحص النظام
// ========================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        system: "Raheeb Soft PRO",
        status: "online",
        time: new Date().toISOString()
    });
});

// ========================================
// الإصدار
// ========================================

app.get("/api/version", (req, res) => {

    res.json({
        success: true,
        name: "الرهيب سوفت PRO",
        version: "5.0.0"
    });
});

// ========================================
// جلب قاعدة البيانات
// ========================================

app.get("/api/database", (req, res) => {

    try {

        const db = loadDatabase();

        res.json({
            success: true,
            data: db
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// حفظ قاعدة البيانات
// ========================================

app.post("/api/database", (req, res) => {

    try {

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {

            return res.status(400).json({
                success: false,
                error: "بيانات غير صحيحة"
            });
        }

        const db = saveDatabase(req.body);

        res.json({
            success: true,
            message: "تم حفظ البيانات بنجاح",
            data: db
        });

    } catch (error) {

        console.error(
            "Database Save Error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// اختبار قاعدة البيانات
// ========================================

app.get("/api/test", (req, res) => {

    try {

        const db = loadDatabase();

        res.json({

            success: true,

            message: "النظام وقاعدة البيانات يعملان",

            statistics: {

                products: db.products.length,

                customers: db.customers.length,

                suppliers: db.suppliers.length,

                invoices: db.invoices.length,

                purchases: db.purchases.length,

                salesReturns:
                    db.salesReturns.length,

                purchaseReturns:
                    db.purchaseReturns.length,

                quotations:
                    db.quotations.length,

                expenses:
                    db.expenses.length,

                income:
                    db.income.length,

                receipts:
                    db.receipts.length,

                payments:
                    db.payments.length,

                stockMovements:
                    db.stockMovements.length

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            error: error.message

        });
    }
});

// ========================================
// معالجة الأخطاء
// ========================================

app.use((err, req, res, next) => {

    console.error(
        "Server Error:",
        err
    );

    res.status(500).json({

        success: false,

        error: "حدث خطأ داخل الخادم",

        message: err.message

    });
});

// ========================================
// تشغيل السيرفر
// ========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "الرهيب سوفت PRO يعمل بنجاح"
        );

        console.log(
            "PORT:",
            PORT
        );

        console.log(
            "Database:",
            DB_FILE
        );

        console.log(
            "HTML:",
            HTML_FILE
        );

        console.log(
            "===================================="
        );
    }
);
