const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(__dirname, "raheeb-soft.html");

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

function createDatabase() {
    return {
        settings: {
            companyName: "مؤسسة الرهيب",
            phone: "",
            address: "",
            taxNumber: "",
            currency: "ريال سعودي",
            taxEnabled: true,
            taxRate: 15,
            invoicePrefix: "INV-",
            nextInvoice: 1,
            logo: "",
            defaultPrinter: "80mm",
            invoiceTemplate: "thermal80",
            invoiceCopies: 1
        },

        users: [
            {
                id: 1,
                name: "المدير",
                username: "admin",
                password: "admin",
                role: "admin",
                active: true
            }
        ],

        products: [],
        categories: [],
        units: ["قطعة", "كرتون", "كيلو", "متر", "علبة"],
        warehouses: [
            {
                id: 1,
                name: "المخزن الرئيسي",
                active: true
            }
        ],

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

        expenses: [],
        income: [],

        receipts: [],
        payments: [],

        cashSessions: [],
        suspendedInvoices: [],

        stockMovements: [],
        journalEntries: [],

        logs: [],

        counters: {
            product: 1,
            category: 1,
            unit: 6,
            warehouse: 2,
            customer: 2,
            supplier: 1,
            invoice: 1,
            purchase: 1,
            return: 1,
            quote: 1,
            expense: 1,
            income: 1,
            receipt: 1,
            payment: 1,
            session: 1,
            journal: 1,
            user: 2
        }
    };
}

function loadDatabase() {

    try {

        if (!fs.existsSync(DB_FILE)) {
            const db = createDatabase();
            saveDatabase(db);
            return db;
        }

        const text = fs.readFileSync(DB_FILE, "utf8");

        if (!text.trim()) {
            const db = createDatabase();
            saveDatabase(db);
            return db;
        }

        const saved = JSON.parse(text);
        const fresh = createDatabase();

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

        Object.keys(fresh).forEach(key => {

            if (Array.isArray(fresh[key])) {

                if (!Array.isArray(db[key])) {
                    db[key] = [];
                }

            }

        });

        return db;

    } catch (error) {

        console.error("DATABASE ERROR:", error);

        const db = createDatabase();

        try {
            saveDatabase(db);
        } catch (e) {
            console.error(e);
        }

        return db;
    }
}

function saveDatabase(db) {

    const temp = DB_FILE + ".tmp";

    fs.writeFileSync(
        temp,
        JSON.stringify(db, null, 2),
        "utf8"
    );

    fs.renameSync(temp, DB_FILE);
}

/* ================================
   الصفحة
================================ */

app.get("/", (req, res) => {

    if (!fs.existsSync(HTML_FILE)) {
        return res.status(404).send(
            "ملف raheeb-soft.html غير موجود"
        );
    }

    res.sendFile(HTML_FILE);
});

/* ================================
   HEALTH
================================ */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        system: "Raheeb Soft PRO",
        status: "online",
        time: new Date().toISOString()
    });
});

/* ================================
   VERSION
================================ */

app.get("/api/version", (req, res) => {

    res.json({
        success: true,
        name: "الرهيب سوفت PRO",
        version: "5.0.0"
    });
});

/* ================================
   GET DATABASE
================================ */

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

/* ================================
   SAVE DATABASE
================================ */

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
            message: "تم حفظ البيانات"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/* ================================
   إضافة حركة
================================ */

app.post("/api/action", (req, res) => {

    try {

        const db = loadDatabase();

        const {
            collection,
            data
        } = req.body;

        if (!collection || !Array.isArray(db[collection])) {

            return res.status(400).json({
                success: false,
                error: "المجموعة غير صحيحة"
            });
        }

        db[collection].push(data);

        saveDatabase(db);

        res.json({
            success: true,
            data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/* ================================
   اختبار
================================ */

app.get("/api/test", (req, res) => {

    const db = loadDatabase();

    res.json({

        success: true,

        statistics: {
            products: db.products.length,
            customers: db.customers.length,
            suppliers: db.suppliers.length,
            sales: db.sales.length,
            purchases: db.purchases.length,
            returns: db.salesReturns.length + db.purchaseReturns.length,
            expenses: db.expenses.length,
            receipts: db.receipts.length,
            payments: db.payments.length,
            stockMovements: db.stockMovements.length
        }

    });
});

/* ================================
   ERROR
================================ */

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        success: false,
        error: err.message
    });
});

/* ================================
   START
================================ */

app.listen(PORT, "0.0.0.0", () => {

    console.log("=================================");
    console.log("الرهيب سوفت PRO يعمل");
    console.log("PORT:", PORT);
    console.log("DATABASE:", DB_FILE);
    console.log("=================================");

});
