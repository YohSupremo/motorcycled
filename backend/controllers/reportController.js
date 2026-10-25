import Order from "../model/Order.js";
import Product from "../model/Product.js";
import InventoryTransaction from "../model/InventoryTransaction.js";
import InstallmentApplication from "../model/InstallmentApplication.js";

const parseDateRange = (dateFrom, dateTo) => {
  const start = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : new Date(0);
  const end = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return null;
  }

  return { start, end };
};

const inRange = (value, range) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end;
};

const customerName = (user, shippingInfo) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  shippingInfo?.recipientName ||
  "Guest customer";

export const getAdminReports = async (req, res) => {
  try {
    const range = parseDateRange(req.query.dateFrom, req.query.dateTo);
    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid date range",
      });
    }

    const [orders, products, transactions, applications] = await Promise.all([
      Order.find()
        .populate("user", "firstName lastName email")
        .populate({
          path: "orderItems.product",
          select: "category",
          populate: { path: "category", select: "name" },
        })
        .sort({ createdAt: -1 })
        .lean(),
      Product.find({ isArchived: { $ne: true } })
        .populate("category", "name")
        .populate("brand", "name")
        .sort({ stock: 1, name: 1 })
        .lean(),
      InventoryTransaction.find({ type: "restock" })
        .sort({ createdAt: -1 })
        .lean(),
      InstallmentApplication.find({ applicationStatus: { $in: ["approved", "pending"] } })
        .populate("user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const rangedOrders = orders.filter(
      (order) =>
        order.orderStatus !== "canceled" &&
        inRange(order.paidAt || order.createdAt, range),
    );
    const paidOrders = rangedOrders.filter(
      (order) => order.paymentStatus === "paid" || order.orderStatus === "completed",
    );

    const salesByDate = new Map();
    for (const order of paidOrders) {
      const date = new Date(order.paidAt || order.createdAt).toISOString().slice(0, 10);
      const row = salesByDate.get(date) || { date, orders: 0, units: 0, sales: 0 };
      row.orders += 1;
      row.sales += Number(order.totalPrice || 0);
      row.units += (order.orderItems || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      salesByDate.set(date, row);
    }

    const orderSummary = rangedOrders.map((order) => ({
      orderNumber: order.orderNumber,
      customer: customerName(order.user, order.shippingInfo),
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      total: Number(order.totalPrice || 0),
      createdAt: order.createdAt,
    }));

    const topProductsMap = new Map();
    for (const order of paidOrders) {
      for (const item of order.orderItems || []) {
        const key = String(item.product?._id || item.name);
        const category = item.product?.category?.name || item.itemType || "Uncategorized";
        const row = topProductsMap.get(key) || {
          product: item.name,
          category,
          units: 0,
          sales: 0,
        };
        row.units += Number(item.quantity || 0);
        row.sales += Number(item.price || 0) * Number(item.quantity || 0);
        topProductsMap.set(key, row);
      }
    }

    const expenses = transactions
      .filter((transaction) => inRange(transaction.createdAt, range))
      .map((transaction) => ({
        reference: transaction.transactionRef,
        product: transaction.productName,
        supplier: transaction.supplierName || "Unassigned",
        quantity: Math.abs(Number(transaction.quantityChange || 0)),
        unitCost: Number(transaction.unitCost || 0),
        total: Math.abs(Number(transaction.quantityChange || 0)) * Number(transaction.unitCost || 0),
        date: transaction.createdAt,
      }));

    const installmentRows = applications.map((application) => {
      const paidHistory = (application.paymentHistory || []).reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );
      const collected = Number(application.downPayment || 0) + paidHistory;
      const outstanding = Math.max(0, Number(application.totalRepayment || 0) - collected);
      return {
        reference: application.applicationRef,
        customer: customerName(application.user, application.shippingInfo),
        product: application.productName,
        status: application.applicationStatus,
        collected,
        outstanding,
        monthlyPayment: Number(application.monthlyPayment || 0),
        payments: application.paymentHistory?.length || 0,
        date: application.updatedAt || application.createdAt,
      };
    });

    const totalSales = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total, 0);
    const totalCollected = installmentRows.reduce((sum, row) => sum + row.collected, 0);
    const totalOutstanding = installmentRows.reduce((sum, row) => sum + row.outstanding, 0);

    return res.status(200).json({
      success: true,
      reports: {
        range: { dateFrom: req.query.dateFrom || "", dateTo: req.query.dateTo || "" },
        sales: {
          totalSales,
          totalOrders: paidOrders.length,
          totalUnits: paidOrders.reduce(
            (sum, order) =>
              sum + (order.orderItems || []).reduce((units, item) => units + Number(item.quantity || 0), 0),
            0,
          ),
          byDate: [...salesByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
        },
        inventory: {
          totalProducts: products.length,
          totalUnits: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
          inventoryValue: products.reduce(
            (sum, product) => sum + Number(product.stock || 0) * Number(product.costPrice || 0),
            0,
          ),
          lowStock: products.filter(
            (product) => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5),
          ).map((product) => ({
            product: product.name,
            category: product.category?.name || "Uncategorized",
            stock: Number(product.stock || 0),
            threshold: Number(product.lowStockThreshold ?? 5),
          })),
        },
        expenses: {
          totalExpenses,
          entries: expenses,
        },
        orders: {
          totalOrders: orderSummary.length,
          totalValue: orderSummary.reduce((sum, order) => sum + order.total, 0),
          entries: orderSummary,
        },
        topProducts: [...topProductsMap.values()].sort((a, b) => b.units - a.units || b.sales - a.sales),
        installments: {
          totalCollected,
          totalOutstanding,
          overdueAccounts: [],
          entries: installmentRows,
          overdueNote: "Overdue status requires persisted installment due dates.",
        },
      },
    });
  } catch (error) {
    console.error("getAdminReports error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not generate reports",
    });
  }
};
