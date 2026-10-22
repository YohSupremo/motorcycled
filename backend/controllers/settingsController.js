import StoreSettings from "../model/StoreSettings.js";

const SETTINGS_KEY = "primary";

const formatSettings = (settings) => ({
  initialCapital: settings?.initialCapital || 0,
});

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
    const initialCapital = Number(req.body.initialCapital);

    if (!Number.isFinite(initialCapital) || initialCapital < 0) {
      return res.status(400).json({
        success: false,
        message: "Initial capital must be zero or greater",
      });
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { initialCapital } },
      {
        new: true,
        upsert: true,
        runValidators: true,
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
