import Supplier from "../model/Supplier.js";
import InventoryTransaction from "../model/InventoryTransaction.js";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const isValidPhone = (value) => {
  if (!value) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const statusFilter = (status) => {
  if (status === "active") return { deletedAt: null };
  if (status === "deactivated" || status === "archived") {
    return { deletedAt: { $ne: null } };
  }
  return {};
};

const formatSupplier = (supplier, stats = {}) => ({
  ...supplier,
  isActive: !supplier.deletedAt,
  restockCount: stats.restockCount || 0,
  totalRestockValue: stats.totalRestockValue || 0,
});

const findDuplicateName = (name, excludeId = null) => {
  const query = { name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } };
  if (excludeId) query._id = { $ne: excludeId };
  return Supplier.findOne(query);
};

const supplierPayload = (body) => ({
  name: cleanString(body.name),
  contactPerson: cleanString(body.contactPerson),
  email: cleanString(body.email).toLowerCase(),
  phone: cleanString(body.phone),
  address: cleanString(body.address),
});

// GET /api/v1/suppliers?status=active|deactivated|all
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find(statusFilter(req.query.status))
      .sort({ name: 1 })
      .lean();

    const stats = await InventoryTransaction.aggregate([
      { $match: { type: "restock", supplierId: { $ne: "" } } },
      {
        $group: {
          _id: "$supplierId",
          restockCount: { $sum: 1 },
          totalRestockValue: {
            $sum: { $multiply: [{ $abs: "$quantityChange" }, "$unitCost"] },
          },
        },
      },
    ]);

    const statsById = new Map(stats.map((entry) => [String(entry._id), entry]));

    return res.status(200).json({
      success: true,
      suppliers: suppliers.map((supplier) =>
        formatSupplier(supplier, statsById.get(String(supplier._id))),
      ),
    });
  } catch (error) {
    console.error("getSuppliers error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load suppliers",
    });
  }
};

// POST /api/v1/admin/supplier/new
export const createSupplier = async (req, res) => {
  try {
    const payload = supplierPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    if (!isValidPhone(payload.phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number (7–15 digits)",
      });
    }

    const existing = await findDuplicateName(payload.name);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.deletedAt
          ? "A deactivated supplier with this name already exists. Restore it instead."
          : "A supplier with this name already exists",
      });
    }

    const supplier = await Supplier.create(payload);

    return res.status(201).json({
      success: true,
      message: "Supplier added",
      supplier: formatSupplier(supplier.toObject()),
    });
  } catch (error) {
    console.error("createSupplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not add supplier",
    });
  }
};

// PUT /api/v1/admin/supplier/:id
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const payload = supplierPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    if (!isValidPhone(payload.phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number (7–15 digits)",
      });
    }

    const duplicate = await findDuplicateName(payload.name, supplier._id);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A supplier with this name already exists",
      });
    }

    Object.assign(supplier, payload);
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier updated",
      supplier: formatSupplier(supplier.toObject()),
    });
  } catch (error) {
    console.error("updateSupplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update supplier",
    });
  }
};

// DELETE /api/v1/admin/supplier/:id
// Soft-deletes the supplier so they no longer appear in new restock selections,
// while past restock records and financial audits remain completely intact.
export const deactivateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    if (supplier.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Supplier is already deactivated",
      });
    }

    supplier.deletedAt = new Date();
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier deactivated",
      supplier: formatSupplier(supplier.toObject()),
    });
  } catch (error) {
    console.error("deactivateSupplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not deactivate supplier",
    });
  }
};

// PUT /api/v1/admin/supplier/:id/restore
export const restoreSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    if (!supplier.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Supplier is already active",
      });
    }

    supplier.deletedAt = null;
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier restored",
      supplier: formatSupplier(supplier.toObject()),
    });
  } catch (error) {
    console.error("restoreSupplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not restore supplier",
    });
  }
};
