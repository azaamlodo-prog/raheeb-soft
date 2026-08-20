const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// مسارات الملفات
// ===============================

const DB_FILE = path.join(__dirname, "database.json");
const HTML_FILE = path.join(
  __dirname,
  "public",
  "raheeb-soft.html"
);

// ===============================
// إعدادات Express
// ===============================

app.use(express.json({
  limit: "25mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "25mb"
}));

// الملفات الثابتة
app.use(express.static(
  path.join(__dirname, "public")
));

// ===============================
// إنشاء قاعدة البيانات
// ===============================

function createDatabase() {

  return {

    settings: {
      companyName: "الرهيب سوفت",
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
        role: "admin"
      }
    ],

    products: [],
    categories: [],
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

    expenses: [],
    receipts: [],
    payments: [],

    cashSessions: [],
    suspendedInvoices: [],

    stockMovements: [],

    counters: {
      product: 1,
      customer: 2,
      supplier: 1,

      invoice: 1,
      purchase: 1,

      expense: 1,
      receipt: 1,
      payment: 1,

      session: 1
    }

  };

}

// ===============================
// تحميل قاعدة البيانات
// ===============================

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

    const fileContent = fs.readFileSync(
      DB_FILE,
      "utf8"
    );

    if (!fileContent.trim()) {

      const db = createDatabase();

      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(db, null, 2),
        "utf8"
      );

      return db;
    }

    const saved = JSON.parse(fileContent);

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
      },

      users: Array.isArray(saved.users)
        ? saved.users
        : fresh.users,

      products: Array.isArray(saved.products)
        ? saved.products
        : [],

      categories: Array.isArray(saved.categories)
        ? saved.categories
        : [],

      warehouses: Array.isArray(saved.warehouses)
        ? saved.warehouses
        : [],

      customers: Array.isArray(saved.customers)
        ? saved.customers
        : fresh.customers,

      suppliers: Array.isArray(saved.suppliers)
        ? saved.suppliers
        : [],

      invoices: Array.isArray(saved.invoices)
        ? saved.invoices
        : [],

      purchases: Array.isArray(saved.purchases)
        ? saved.purchases
        : [],

      salesReturns: Array.isArray(saved.salesReturns)
        ? saved.salesReturns
        : [],

      purchaseReturns: Array.isArray(saved.purchaseReturns)
        ? saved.purchaseReturns
        : [],

      expenses: Array.isArray(saved.expenses)
        ? saved.expenses
        : [],

      receipts: Array.isArray(saved.receipts)
        ? saved.receipts
        : [],

      payments: Array.isArray(saved.payments)
        ? saved.payments
        : [],

      cashSessions: Array.isArray(saved.cashSessions)
        ? saved.cashSessions
        : [],

      suspendedInvoices: Array.isArray(saved.suspendedInvoices)
        ? saved.suspendedInvoices
        : [],

      stockMovements: Array.isArray(saved.stockMovements)
        ? saved.stockMovements
        : []

    };

  } catch (error) {

    console.error(
      "خطأ في قراءة قاعدة البيانات:",
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
        "خطأ في إنشاء قاعدة البيانات:",
        writeError.message
      );

    }

    return db;
  }

}

// ===============================
// حفظ قاعدة البيانات
// ===============================

function saveDatabase(db) {

  const temporaryFile =
    DB_FILE + ".tmp";

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(
    temporaryFile,
    DB_FILE
  );

}

// ===============================
// الصفحة الرئيسية
// ===============================

app.get("/", (req, res) => {

  if (
    fs.existsSync(HTML_FILE)
  ) {

    return res.sendFile(
      HTML_FILE
    );

  }

  res.status(404).send(
    "ملف النظام raheeb-soft.html غير موجود داخل مجلد public"
  );

});

// ===============================
// فحص النظام
// ===============================

app.get("/api/health", (req, res) => {

  res.json({

    success: true,

    system: "Raheeb Soft PRO",

    status: "online",

    time: new Date().toISOString()

  });

});

// ===============================
// رقم إصدار النظام
// ===============================

app.get("/api/version", (req, res) => {

  res.json({

    success: true,

    name: "الرهيب سوفت PRO",

    version: "4.0.0"

  });

});

// ===============================
// جلب قاعدة البيانات
// ===============================

app.get("/api/database", (req, res) => {

  try {

    const db = loadDatabase();

    res.json({

      success: true,

      data: db

    });

  } catch (error) {

    console.error(
      "Database GET Error:",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

// ===============================
// حفظ قاعدة البيانات
// ===============================

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

    saveDatabase(req.body);

    res.json({

      success: true,

      message: "تم حفظ البيانات بنجاح"

    });

  } catch (error) {

    console.error(
      "Database POST Error:",
      error
    );

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

// ===============================
// API لاختبار قاعدة البيانات
// ===============================

app.get("/api/test", (req, res) => {

  try {

    const db = loadDatabase();

    res.json({

      success: true,

      message: "النظام يعمل وقاعدة البيانات متصلة",

      statistics: {

        products: db.products.length,

        customers: db.customers.length,

        suppliers: db.suppliers.length,

        invoices: db.invoices.length,

        purchases: db.purchases.length,

        expenses: db.expenses.length

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: "حدث خطأ",

      error: error.message

    });

  }

});

// ===============================
// معالجة الأخطاء
// ===============================

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

// ===============================
// تشغيل السيرفر
// ===============================

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
