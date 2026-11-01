import StoreSettings from "../model/StoreSettings.js";

const SETTINGS_KEY = "primary";

const STATIC_INSTALLMENT_PLANS = [
  { id: "PLAN-12M", name: "12 Months Standard", termMonths: 12, interestRate: 7, minDownpaymentPercent: 20, processingFee: 1500 },
  { id: "PLAN-24M", name: "24 Months Extended", termMonths: 24, interestRate: 8, minDownpaymentPercent: 20, processingFee: 1500 },
  { id: "PLAN-36M", name: "36 Months Tier 1 Big Bike", termMonths: 36, interestRate: 9, minDownpaymentPercent: 25, processingFee: 1500 },
];

const formatSettings = (settings) => ({
  taxRate: settings?.taxRate ?? 12,
  defaultLowStockThreshold: settings?.defaultLowStockThreshold ?? 5,
  downpaymentRefundable: settings?.downpaymentRefundable ?? "forfeited",
  globalShippingFee: settings?.globalShippingFee ?? 350,
  installmentPlans: STATIC_INSTALLMENT_PLANS,
});

const updateFields = [
  "taxRate",
  "defaultLowStockThreshold",
  "downpaymentRefundable",
  "globalShippingFee",
];

export const getStoreSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne({ key: SETTINGS_KEY }).lean();

    return res.status(200).json({
      success: true,
      settings: formatSettings(settings),
    });
  } catch (error) {
    console.error("getStoreSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load store settings",
    });
  }
};

export const updateStoreSettings = async (req, res) => {
  try {
    const updates = {};
    for (const field of updateFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { key: SETTINGS_KEY, ...updates } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Settings saved",
      settings: formatSettings(settings),
    });
  } catch (error) {
    console.error("updateStoreSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save store settings",
    });
  }
};
