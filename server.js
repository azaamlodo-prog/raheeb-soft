const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "database.json");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// إنشاء مجلد قاعدة البيانات
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// قاعدة بيانات جديدة
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
            invoiceNumber: 1
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

// قراءة قاعدة البيانات
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

        const text = fs.readFileSync(
            DB_FILE,
            "utf8"
        );

        if (!text.trim()) {

            const db = createDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        const saved = JSON.parse(text);
        const fresh = createDatabase();

        return {

            ...fresh,
            ...saved,

            settings: {
                ...fresh.settings,
                ...(saved.settings || {})
            },

            counters: {
                ...fresh.counters,
                ...(saved.counters || {})
            }
        };

    } catch (error) {

        console.error(
            "خطأ في قراءة قاعدة البيانات:",
            error.message
        );

        return createDatabase();
    }
}

// حفظ قاعدة البيانات
function saveDatabase(db) {

    const tempFile = DB_FILE + ".tmp";

    fs.writeFileSync(
        tempFile,
        JSON.stringify(db, null, 2),
        "utf8"
    );

    fs.renameSync(
        tempFile,
        DB_FILE
    );
}

// الصفحة الرئيسية
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

// الملفات الثابتة
app.use(express.static(PUBLIC_DIR));

// جلب قاعدة البيانات
app.get("/api/database", (req, res) => {

    try {

        const db = loadDatabase();

        res.json({
            success: true,
            data: db
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// حفظ قاعدة البيانات
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

        saveDatabase(req.body);

        res.json({
            success: true,
            message: "تم حفظ البيانات بنجاح"
        });

    } catch (error) {

        console.error(
            "خطأ أثناء الحفظ:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// فحص النظام
app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        system: "Raheeb Soft PRO",
        status: "online",
        time: new Date().toISOString()
    });
});

// اختبار قاعدة البيانات
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

// معالجة الأخطاء
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

// تشغيل السيرفر
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
