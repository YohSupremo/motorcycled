import bcrypt from "bcrypt";
import User from "../model/User.js";

const customerProjection = "-password -resetPasswordToken -resetPasswordExpire";
const validRoles = new Set(["customer", "admin"]);

const normalizeEmail = (email) => email?.trim().toLowerCase();

const validateCustomerFields = (body, requirePassword = false) => {
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!firstName || !lastName || !email || (requirePassword && !password)) {
    return "First name, last name, email, and password are required";
  }

  if (password && password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
};

export const listAdminCustomers = async (req, res) => {
  const search = req.query.search?.trim();
  const status = req.query.status;
  const filter = {};

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { contactNumber: searchRegex },
    ];
  }

  const customers = await User.find(filter)
    .select(customerProjection)
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  return res.status(200).json({ success: true, customers });
};

export const createAdminCustomer = async (req, res) => {
  const validationError = validateCustomerFields(req.body, true);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const email = normalizeEmail(req.body.email);
  const existingCustomer = await User.findOne({ email });
  if (existingCustomer) {
    return res.status(409).json({ success: false, message: "Email already exists" });
  }

  const password = await bcrypt.hash(req.body.password, 10);
  const customer = await User.create({
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    email,
    password,
    contactNumber: req.body.contactNumber?.trim() || "",
    role: validRoles.has(req.body.role) ? req.body.role : "customer",
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    customer: customer.toObject({ transform: (_doc, value) => {
      delete value.password;
      delete value.resetPasswordToken;
      delete value.resetPasswordExpire;
      return value;
    } }),
  });
};

export const updateAdminCustomer = async (req, res) => {
  const validationError = validateCustomerFields(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const customer = await User.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (req.body.role && !validRoles.has(req.body.role)) {
    return res.status(400).json({ success: false, message: "Invalid user role" });
  }

  if (customer._id.equals(req.user._id) && req.body.role && req.body.role !== "admin") {
    return res.status(400).json({ success: false, message: "You cannot remove your own admin access" });
  }

  const email = normalizeEmail(req.body.email);
  const emailOwner = await User.findOne({ email, _id: { $ne: customer._id } });
  if (emailOwner) {
    return res.status(409).json({ success: false, message: "Email already exists" });
  }

  customer.firstName = req.body.firstName.trim();
  customer.lastName = req.body.lastName.trim();
  customer.email = email;
  customer.contactNumber = req.body.contactNumber?.trim() || "";
  if (req.body.role) customer.role = req.body.role;
  if (req.body.password) customer.password = await bcrypt.hash(req.body.password, 10);
  await customer.save();

  return res.status(200).json({
    success: true,
    customer: await User.findById(customer._id).select(customerProjection).lean(),
  });
};

const setCustomerActiveState = (isActive) => async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
  }

  const customer = await User.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { isActive } },
    { new: true, runValidators: true },
  ).select(customerProjection).lean();

  if (!customer) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({ success: true, customer });
};

export const deactivateAdminCustomer = setCustomerActiveState(false);
export const reactivateAdminCustomer = setCustomerActiveState(true);
