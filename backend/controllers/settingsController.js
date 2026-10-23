import StoreSettings from "../model/StoreSettings.js";

const SETTINGS_KEY = "primary";

const formatSettings = () => ({});

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
    const settings = await StoreSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { key: SETTINGS_KEY } },
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
