import bcrypt from "bcrypt";
import User from "../model/User.js";
import Address from "../model/Address.js";

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      contactNumber,
      street,
      barangay,
      city,
      postalCode,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
        success: false,
      });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const isExisting = await User.findOne({
      email,
    });

    if (isExisting) {
      return res.status(409).json({
        message: "Email already exists",
        success: false,
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      contactNumber,
      email,
      password: hashedpassword,
    });

    const address = await Address.create({
      userId: user._id,
      street,
      barangay,
      city,
      postalCode,
    });

    return res.status(201).json({
      message: "User created successfully!",
      success: true,
      user,
      address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal service error",
      success: false,
    });
  }
};

export const login = (req, res) => {};

export const logout = (req, res) => {};

export const forgotPassword = (req, res) => {};

export const resetPassword = (req, res) => {};
