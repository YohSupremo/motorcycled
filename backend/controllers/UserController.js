import User from "../model/User.js";
import Address from "../model/Address.js";
import { cloudConf } from "../config/cloudinary.js";

const uploadProfilePicture = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudConf.uploader.upload_stream(
      { folder: "profile", resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(fileBuffer);
  });

const getAddresses = (userId) =>
  Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password").lean();
  return res.status(200).json({ success: true, profile: user });
};

export const updateProfile = async (req, res) => {
  const allowedFields = ["firstName", "lastName", "contactNumber"];
  const updates = Object.fromEntries(
    allowedFields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]]),
  );

  if (req.file) {
    updates.profilePicture = await uploadProfilePicture(req.file.buffer);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "At least one profile field is required",
      success: false,
    });
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })
    .select("-password")
    .lean();

  return res.status(200).json({ success: true, profile: user });
};

export const listAddresses = async (req, res) => {
  const addresses = await getAddresses(req.user._id);
  return res.status(200).json({ success: true, addresses });
};

const addressFields = ["label", "street", "barangay", "city", "postalCode"];
const getAddressUpdates = (body) =>
  Object.fromEntries(
    addressFields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, body[field]]),
  );

const validateAddress = (address) =>
  ["street", "barangay", "city", "postalCode"].every((field) =>
    address[field]?.trim(),
  );

export const addAddress = async (req, res) => {
  if (!validateAddress(req.body)) {
    return res.status(400).json({
      message: "Street, barangay, city, and postal code are required",
      success: false,
    });
  }

  const hasAddress = await Address.exists({ userId: req.user._id });
  const address = await Address.create({
    ...getAddressUpdates(req.body),
    userId: req.user._id,
    isDefault: !hasAddress || Boolean(req.body.isDefault),
  });

  if (address.isDefault) {
    await Address.updateMany(
      { userId: req.user._id, _id: { $ne: address._id } },
      { $set: { isDefault: false } },
    );
  }

  return res.status(201).json({ success: true, address });
};

export const updateAddress = async (req, res) => {
  const updates = getAddressUpdates(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "At least one address field is required",
      success: false,
    });
  }

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true },
  );

  if (!address) {
    return res
      .status(404)
      .json({ message: "Address not found", success: false });
  }

  return res.status(200).json({ success: true, address });
};

export const deleteAddress = async (req, res) => {
  const address = await Address.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!address) {
    return res
      .status(404)
      .json({ message: "Address not found", success: false });
  }

  if (address.isDefault) {
    const replacement = await Address.findOne({ userId: req.user._id }).sort({
      createdAt: 1,
    });
    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }

  return res.status(200).json({
    success: true,
    addressId: address._id,
  });
};

export const setDefaultAddress = async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!address) {
    return res
      .status(404)
      .json({ message: "Address not found", success: false });
  }

  await Address.updateMany(
    { userId: req.user._id },
    { $set: { isDefault: false } },
  );
  address.isDefault = true;
  await address.save();

  return res.status(200).json({ success: true, address });
};
