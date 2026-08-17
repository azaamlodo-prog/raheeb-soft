const express = require("express");
const sql = require("mssql/msnodesqlv8");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const config = {
    server: "localhost",
    database: "RaheebSoftDB",
    driver: "msnodesqlv8",
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

async function connectDB() {
    try {
        await sql.connect(config);
        console.log("=================================");
        console.log("تم الاتصال بقاعدة البيانات بنجاح");
        console.log("قاعدة البيانات: RaheebSoftDB");
        console.log("=================================");
    } catch (error) {
        console.error("خطأ في الاتصال بقاعدة البيانات:");
        console.error(error);
    }
}

/* اختبار قاعدة البيانات */
app.get("/api/test", async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT DB_NAME() AS DatabaseName
        `);

        res.json({
            success: true,
            database: result.recordset[0].DatabaseName
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/* ================= الأصناف ================= */

app.get("/api/products", async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT
                ProductId,
                ProductName,
                Barcode,
                PurchasePrice,
                SalePrice,
                Quantity,
                CreatedAt
            FROM Products
            ORDER BY ProductId DESC
        `);

        res.json({
            success: true,
            products: result.recordset
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/* البحث بالباركود */

app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {

        const request = new sql.Request();

        request.input(
            "Barcode",
            sql.NVarChar,
            req.params.barcode
        );

        const result = await request.query(`
            SELECT
                ProductId,
                ProductName,
                Barcode,
                PurchasePrice,
                SalePrice,
                Quantity
            FROM Products
            WHERE Barcode = @Barcode
        `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "الصنف غير موجود"
            });

        }

        res.json({
            success: true,
            product: result.recordset[0]
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }
});

/* ================= العملاء ================= */

app.get("/api/customers", async (req, res) => {

    try {

        const result = await sql.query(`
            SELECT
                CustomerId,
                CustomerName,
                Phone,
                Address,
                CreatedAt
            FROM Customers
            ORDER BY CustomerId DESC
        `);

        res.json({
            success: true,
            customers: result.recordset
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

/* ================= الموردون ================= */

app.get("/api/suppliers", async (req, res) => {

    try {

        const result = await sql.query(`
            SELECT
                SupplierId,
                SupplierName,
                Phone,
                Address,
                CreatedAt
            FROM Suppliers
            ORDER BY SupplierId DESC
        `);

        res.json({
            success: true,
            suppliers: result.recordset
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

/* ================= رقم فاتورة البيع ================= */

app.get("/api/sales/next-number", async (req, res) => {

    try {

        const result = await sql.query(`
            SELECT MAX(TRY_CONVERT(INT, InvoiceNumber)) AS LastNumber
            FROM SalesInvoices
        `);

        let last =
            Number(result.recordset[0].LastNumber) || 1000;

        res.json({
            success: true,
            invoiceNumber: last + 1
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

/* ================= حفظ فاتورة البيع ================= */

app.post("/api/sales", async (req, res) => {

    const transaction = new sql.Transaction();

    try {

        const {
            invoiceNumber,
            customerId,
            invoiceDate,
            paymentType,
            invoiceType,
            subtotal,
            discount,
            tax,
            total,
            paid,
            remaining,
            items
        } = req.body;

        if (!items || items.length === 0) {

            return res.status(400).json({
                success: false,
                message: "الفاتورة فارغة"
            });

        }

        await transaction.begin();

        const request = new sql.Request(transaction);

        request.input(
            "InvoiceNumber",
            sql.NVarChar,
            String(invoiceNumber)
        );

        request.input(
            "CustomerId",
            sql.Int,
            customerId ? Number(customerId) : null
        );

        request.input(
            "InvoiceDate",
            sql.DateTime2,
            invoiceDate ? new Date(invoiceDate) : new Date()
        );

        request.input(
            "SubTotal",
            sql.Decimal(18, 2),
            Number(subtotal) || 0
        );

        request.input(
            "Discount",
            sql.Decimal(18, 2),
            Number(discount) || 0
        );

        request.input(
            "Tax",
            sql.Decimal(18, 2),
            Number(tax) || 0
        );

        request.input(
            "Total",
            sql.Decimal(18, 2),
            Number(total) || 0
        );

        request.input(
            "Paid",
            sql.Decimal(18, 2),
            Number(paid) || 0
        );

        request.input(
            "Remaining",
            sql.Decimal(18, 2),
            Number(remaining) || 0
        );

        const invoiceResult = await request.query(`
            INSERT INTO SalesInvoices
            (
                InvoiceNumber,
                CustomerId,
                InvoiceDate,
                SubTotal,
                Discount,
                Tax,
                Total,
                Paid,
                Remaining
            )
            OUTPUT INSERTED.SalesInvoiceId
            VALUES
            (
                @InvoiceNumber,
                @CustomerId,
                @InvoiceDate,
                @SubTotal,
                @Discount,
                @Tax,
                @Total,
                @Paid,
                @Remaining
            )
        `);

        const salesInvoiceId =
            invoiceResult.recordset[0].SalesInvoiceId;

        for (const item of items) {

            const itemRequest =
                new sql.Request(transaction);

            itemRequest.input(
                "SalesInvoiceId",
                sql.Int,
                salesInvoiceId
            );

            itemRequest.input(
                "ProductId",
                sql.Int,
                Number(item.productId)
            );

            itemRequest.input(
                "Quantity",
                sql.Decimal(18, 3),
                Number(item.quantity || item.qty) || 0
            );

            itemRequest.input(
                "UnitPrice",
                sql.Decimal(18, 2),
                Number(item.unitPrice || item.price) || 0
            );

            itemRequest.input(
                "Discount",
                sql.Decimal(18, 2),
                Number(item.discount) || 0
            );

            itemRequest.input(
                "Tax",
                sql.Decimal(18, 2),
                Number(item.tax) || 0
            );

            itemRequest.input(
                "Total",
                sql.Decimal(18, 2),
                Number(item.total) || 0
            );

            await itemRequest.query(`
                INSERT INTO SalesItems
                (
                    SalesInvoiceId,
                    ProductId,
                    Quantity,
                    UnitPrice,
                    Discount,
                    Tax,
                    Total
                )
                VALUES
                (
                    @SalesInvoiceId,
                    @ProductId,
                    @Quantity,
                    @UnitPrice,
                    @Discount,
                    @Tax,
                    @Total
                )
            `);

            const stockRequest =
                new sql.Request(transaction);

            stockRequest.input(
                "ProductId",
                sql.Int,
                Number(item.productId)
            );

            stockRequest.input(
                "Quantity",
                sql.Decimal(18, 3),
                Number(item.quantity || item.qty) || 0
            );

            await stockRequest.query(`
                UPDATE Products
                SET Quantity = Quantity - @Quantity
                WHERE ProductId = @ProductId
            `);
        }

        await transaction.commit();

        res.json({
            success: true,
            message: "تم حفظ فاتورة البيع بنجاح",
            salesInvoiceId: salesInvoiceId
        });

    } catch (error) {

        try {
            await transaction.rollback();
        } catch {}

        res.status(500).json({
            success: false,
            message: "فشل حفظ الفاتورة",
            error: error.message
        });

    }

});

/* ================= البحث في الفواتير ================= */

app.get("/api/sales", async (req, res) => {

    try {

        const search =
            (req.query.search || "").trim();

        const request = new sql.Request();

        request.input(
            "Search",
            sql.NVarChar,
            `%${search}%`
        );

        const result = await request.query(`
            SELECT TOP 200
                s.SalesInvoiceId,
                s.InvoiceNumber,
                s.InvoiceDate,
                s.SubTotal,
                s.Discount,
                s.Tax,
                s.Total,
                s.Paid,
                s.Remaining,
                c.CustomerName
            FROM SalesInvoices s
            LEFT JOIN Customers c
                ON c.CustomerId = s.CustomerId
            WHERE
                @Search = '%%'
                OR s.InvoiceNumber LIKE @Search
                OR c.CustomerName LIKE @Search
            ORDER BY s.SalesInvoiceId DESC
        `);

        res.json({
            success: true,
            invoices: result.recordset
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

/* ================= تفاصيل فاتورة ================= */

app.get("/api/sales/:id", async (req, res) => {

    try {

        const id = Number(req.params.id);

        const request = new sql.Request();

        request.input(
            "SalesInvoiceId",
            sql.Int,
            id
        );

        const invoice = await request.query(`
            SELECT
                s.*,
                c.CustomerName,
                c.Phone AS CustomerPhone
            FROM SalesInvoices s
            LEFT JOIN Customers c
                ON c.CustomerId = s.CustomerId
            WHERE s.SalesInvoiceId = @SalesInvoiceId
        `);

        const items = await request.query(`
            SELECT
                si.*,
                p.ProductName
            FROM SalesItems si
            LEFT JOIN Products p
                ON p.ProductId = si.ProductId
            WHERE si.SalesInvoiceId = @SalesInvoiceId
        `);

        res.json({
            success: true,
            invoice: invoice.recordset[0],
            items: items.recordset
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

/* ================= الحركة اليومية ================= */

app.get("/api/daily-movement", async (req, res) => {

    try {

        const date =
            req.query.date ||
            new Date().toISOString().slice(0, 10);

        const request = new sql.Request();

        request.input(
            "Date",
            sql.Date,
            date
        );

        const sales = await request.query(`
            SELECT
                COUNT(*) AS InvoiceCount,
                ISNULL(SUM(Total),0) AS TotalSales,
                ISNULL(SUM(Paid),0) AS PaidSales,
                ISNULL(SUM(Remaining),0) AS RemainingSales
            FROM SalesInvoices
            WHERE CAST(InvoiceDate AS DATE) = @Date
        `);

        const purchases = await request.query(`
            SELECT
                COUNT(*) AS InvoiceCount,
                ISNULL(SUM(Total),0) AS TotalPurchases,
                ISNULL(SUM(Paid),0) AS PaidPurchases,
                ISNULL(SUM(Remaining),0) AS RemainingPurchases
            FROM PurchaseInvoices
            WHERE CAST(InvoiceDate AS DATE) = @Date
        `);

        const movements = await request.query(`
            SELECT
                SalesInvoiceId AS InvoiceId,
                InvoiceNumber,
                InvoiceDate,
                Total,
                Paid,
                Remaining,
                'مبيعات' AS MovementType
            FROM SalesInvoices
            WHERE CAST(InvoiceDate AS DATE) = @Date

            ORDER BY InvoiceDate DESC
        `);

        res.json({
            success: true,
            date: date,
            sales: sales.recordset[0],
            purchases: purchases.recordset[0],
            movements: movements.recordset
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

/* ================= تشغيل السيرفر ================= */

app.listen(3000, async () => {

    console.log("الرهيب سوفت يعمل على المنفذ 3000");

    console.log("=================================");

    await connectDB();

});