const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "database.json");
const TMP_FILE = DB_FILE + ".tmp";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ==========================================
// إنشاء مجلد قاعدة البيانات
// ==========================================

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// ==========================================
// إنشاء قاعدة بيانات جديدة
// ==========================================

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
            taxRate: 15
        },

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
                name: "المدير",
                username: "admin",
                role: "admin"
            }
        ],

        logs: [],

        counters: {
            product: 1,
            customer: 2,
            supplier: 1,
            invoice: 1,
            purchase: 1,
            receipt: 1,
            payment: 1,
            expense: 1,
            income: 1,
            quote: 1,
            session: 1
        }
    };
}

// ==========================================
// توحيد قاعدة البيانات
// ==========================================

function normalizeDatabase(saved) {

    const fresh = createDatabase();

    const db = {
        ...fresh,
        ...(saved || {}),

        settings: {
            ...fresh.settings,
            ...((saved && saved.settings) || {})
        },

        counters: {
            ...fresh.counters,
            ...((saved && saved.counters) || {})
        }
    };

    const arrays = [
        "products",
        "categories",
        "units",
        "warehouses",
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
        "logs"
    ];

    arrays.forEach(key => {
        if (!Array.isArray(db[key])) {
            db[key] = [];
        }
    });

    // ضمان وجود العميل النقدي
    if (!db.customers.some(c => Number(c.id) === 1)) {
        db.customers.unshift({
            id: 1,
            name: "عميل نقدي",
            phone: "",
            address: "",
            balance: 0
        });
    }

    // ضمان وجود المدير
    if (!db.users.some(u => u.username === "admin")) {
        db.users.unshift({
            id: 1,
            name: "المدير",
            username: "admin",
            role: "admin"
        });
    }

    return db;
}

// ==========================================
// قراءة قاعدة البيانات
// ==========================================

function loadDatabase() {

    try {

        if (!fs.existsSync(DB_FILE)) {

            const db = createDatabase();

            saveDatabase(db);

            return db;
        }

        const text = fs.readFileSync(
            DB_FILE,
            "utf8"
        );

        if (!text.trim()) {

            const db = createDatabase();

            saveDatabase(db);

            return db;
        }

        const saved = JSON.parse(text);

        return normalizeDatabase(saved);

    } catch (error) {

        console.error(
            "خطأ في قراءة قاعدة البيانات:",
            error.message
        );

        return createDatabase();
    }
}

// ==========================================
// حفظ قاعدة البيانات
// ==========================================

function saveDatabase(db) {

    const normalized = normalizeDatabase(db);

    fs.writeFileSync(
        TMP_FILE,
        JSON.stringify(normalized, null, 2),
        "utf8"
    );

    fs.renameSync(
        TMP_FILE,
        DB_FILE
    );

    return true;
}

// ==========================================
// الصفحة الرئيسية
// ==========================================

app.get("/", (req, res) => {

    const htmlFile = path.join(
        PUBLIC_DIR,
        "raheeb-soft.html"
    );

    if (!fs.existsSync(htmlFile)) {

        return res.status(404).send(
            "ملف raheeb-soft.html غير موجود داخل مجلد public"
        );
    }

    res.sendFile(htmlFile);
});

// ==========================================
// الملفات الثابتة
// ==========================================

app.use(
    express.static(PUBLIC_DIR)
);

// ==========================================
// جلب قاعدة البيانات
// ==========================================

app.get("/api/database", (req, res) => {

    try {

        const db = loadDatabase();

        res.json({
            success: true,
            data: db
        });

    } catch (error) {

        console.error(
            "خطأ في تحميل قاعدة البيانات:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================
// حفظ قاعدة البيانات
// ==========================================

app.post("/api/database", (req, res) => {

    try {

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {

            return res.status(400).json({
                success: false,
                error: "بيانات قاعدة البيانات غير صحيحة"
            });
        }

        const db = normalizeDatabase(req.body);

        saveDatabase(db);

        const check = loadDatabase();

        res.json({
            success: true,
            message: "تم حفظ البيانات بنجاح",

            statistics: {
                products: check.products.length,
                customers: check.customers.length,
                suppliers: check.suppliers.length,
                sales: check.sales.length,
                purchases: check.purchases.length,
                expenses: check.expenses.length,
                receipts: check.receipts.length,
                payments: check.payments.length
            }
        });

    } catch (error) {

        console.error(
            "خطأ أثناء حفظ قاعدة البيانات:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================
// فحص النظام
// ==========================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        system: "Raheeb Soft PRO",
        status: "online",
        time: new Date().toISOString()
    });
});

// ==========================================
// اختبار قاعدة البيانات
// ==========================================

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
                sales: db.sales.length,
                purchases: db.purchases.length,
                expenses: db.expenses.length,
                receipts: db.receipts.length,
                payments: db.payments.length
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================
// أي API غير موجود
// ==========================================

app.use("/api", (req, res) => {

    res.status(404).json({
        success: false,
        error: "API غير موجود"
    });

});

// ==========================================
// معالجة الأخطاء
// ==========================================

app.use((err, req, res, next) => {

    console.error(
        "Server Error:",
        err
    );

    res.status(500).json({
        success: false,
        error: err.message
    });
});

// ==========================================
// تشغيل السيرفر
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "======================================"
        );

        console.log(
            "الرهيب سوفت PRO يعمل بنجاح"
        );

        console.log(
            "PORT:",
            PORT
        );

        console.log(
            "DATABASE:",
            DB_FILE
        );

        console.log(
            "======================================"
        );
    }
);
