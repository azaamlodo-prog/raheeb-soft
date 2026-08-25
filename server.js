const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// مسارات الملفات
// =====================================================

const ROOT_DIR = __dirname;

const HTML_FILE = path.join(
    ROOT_DIR,
    "raheeb-soft.html"
);

const DB_FILE = path.join(
    ROOT_DIR,
    "database.json"
);

// =====================================================
// إعداد Express
// =====================================================

app.use(express.json({
    limit: "50mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));

// =====================================================
// إنشاء قاعدة البيانات الافتراضية
// =====================================================

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
            nextInvoice: 1
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
            sale: 1,
            invoice: 1,
            purchase: 1,
            receipt: 1,
            payment: 1,
            expense: 1,
            income: 1,
            quote: 1,
            return: 1,
            session: 1,
            log: 1
        }
    };
}

// =====================================================
// قراءة قاعدة البيانات
// =====================================================

function ensureDatabase() {

    try {

        // إذا لم توجد قاعدة البيانات
        if (!fs.existsSync(DB_FILE)) {

            const db = createDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        // قراءة الملف
        const text = fs.readFileSync(
            DB_FILE,
            "utf8"
        );

        // إذا كان فارغاً
        if (!text.trim()) {

            const db = createDatabase();

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

            return db;
        }

        // تحويل JSON
        const saved = JSON.parse(text);

        const fresh = createDatabase();

        // دمج البيانات القديمة مع الهيكل الجديد
        const db = {

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

        // ضمان وجود جميع الجداول
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

        arrays.forEach(name => {

            if (!Array.isArray(db[name])) {

                db[name] = [];

            }

        });

        return db;

    } catch (error) {

        console.error(
            "خطأ في قراءة database.json:",
            error.message
        );

        const db = createDatabase();

        try {

            fs.writeFileSync(
                DB_FILE,
                JSON.stringify(db, null, 2),
                "utf8"
            );

        } catch (writeError) {

            console.error(
                "تعذر إنشاء قاعدة البيانات:",
                writeError.message
            );

        }

        return db;
    }
}

// =====================================================
// حفظ قاعدة البيانات
// =====================================================

function saveDatabase(db) {

    const tempFile =
        DB_FILE + ".tmp";

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

// =====================================================
// الصفحة الرئيسية
// =====================================================

app.get("/", (req, res) => {

    if (!fs.existsSync(HTML_FILE)) {

        return res.status(404).send(`
<!DOCTYPE html>

<html lang="ar" dir="rtl">

<head>

<meta charset="UTF-8">

<title>الرهيب سوفت PRO</title>

<style>

body{
    font-family:Tahoma,Arial;
    background:#f5f7f8;
    text-align:center;
    padding:50px;
}

.box{
    background:white;
    padding:35px;
    border-radius:12px;
    max-width:600px;
    margin:auto;
    box-shadow:0 5px 20px rgba(0,0,0,.1);
}

h2{
    color:#c94747;
}

code{
    background:#eee;
    padding:8px;
    border-radius:5px;
}

</style>

</head>

<body>

<div class="box">

<h2>ملف النظام غير موجود</h2>

<p>
السيرفر يعمل، ولكن لم يجد ملف:
</p>

<p>
<code>raheeb-soft.html</code>
</p>

<p>
يجب أن يكون الملف في نفس مكان:
</p>

<p>
<code>server.js</code>
</p>

</div>

</body>

</html>
        `);
    }

    res.sendFile(HTML_FILE);
});

// =====================================================
// فتح ملف النظام مباشرة
// =====================================================

app.get(
    "/raheeb-soft.html",
    (req, res) => {

        if (!fs.existsSync(HTML_FILE)) {

            return res.status(404).send(
                "raheeb-soft.html غير موجود"
            );
        }

        res.sendFile(HTML_FILE);
    }
);

// =====================================================
// الملفات الثابتة
// =====================================================

app.use(
    express.static(ROOT_DIR)
);

// =====================================================
// جلب قاعدة البيانات
// =====================================================

app.get(
    "/api/database",
    (req, res) => {

        try {

            const db =
                ensureDatabase();

            res.json({

                success: true,

                data: db

            });

        } catch (error) {

            console.error(
                "DATABASE GET ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    error.message

            });
        }
    }
);

// =====================================================
// حفظ قاعدة البيانات
// =====================================================

app.post(
    "/api/database",
    (req, res) => {

        try {

            if (
                !req.body ||
                typeof req.body !== "object" ||
                Array.isArray(req.body)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "بيانات قاعدة البيانات غير صحيحة"

                });
            }

            saveDatabase(
                req.body
            );

            res.json({

                success: true,

                message:
                    "تم حفظ البيانات بنجاح"

            });

        } catch (error) {

            console.error(
                "DATABASE SAVE ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    error.message

            });
        }
    }
);

// =====================================================
// فحص النظام
// =====================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            system:
                "Raheeb Soft PRO",

            status:
                "online",

            time:
                new Date().toISOString()

        });
    }
);

// =====================================================
// اختبار النظام وقاعدة البيانات
// =====================================================

app.get(
    "/api/test",
    (req, res) => {

        try {

            const db =
                ensureDatabase();

            res.json({

                success: true,

                message:
                    "النظام وقاعدة البيانات يعملان",

                statistics: {

                    products:
                        db.products.length,

                    customers:
                        db.customers.length,

                    suppliers:
                        db.suppliers.length,

                    sales:
                        db.sales.length,

                    purchases:
                        db.purchases.length,

                    salesReturns:
                        db.salesReturns.length,

                    purchaseReturns:
                        db.purchaseReturns.length,

                    quotes:
                        db.quotes.length,

                    expenses:
                        db.expenses.length,

                    income:
                        db.income.length,

                    receipts:
                        db.receipts.length,

                    payments:
                        db.payments.length,

                    stockMovements:
                        db.stockMovements.length,

                    users:
                        db.users.length
                }

            });

        } catch (error) {

            res.status(500).json({

                success: false,

                error:
                    error.message

            });
        }
    }
);

// =====================================================
// معلومات النظام
// =====================================================

app.get(
    "/api/info",
    (req, res) => {

        res.json({

            success: true,

            system:
                "Raheeb Soft PRO",

            version:
                "4.0.0",

            server:
                "Node.js + Express",

            database:
                "database.json",

            interface:
                "raheeb-soft.html",

            port:
                PORT
        });
    }
);

// =====================================================
// معالجة أخطاء السيرفر
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            error:
                err.message ||
                "حدث خطأ في السيرفر"

        });
    }
);

// =====================================================
// تشغيل السيرفر
// =====================================================

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
            "HTML:",
            HTML_FILE
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
