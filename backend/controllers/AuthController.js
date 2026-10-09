import bcrypt from "bcrypt";
import User from "../model/User.js";
import Address from "../model/Address.js";
import { cloudConf } from "../config/cloudinary.js";

const uploadHandler = (fileBuffer, folder) => {
  return new Promise((res, rej) => {
    const stream = cloudConf.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        error ? rej(error) : res(result.secure_url);
      },
    );
    stream.end(fileBuffer);
  });
};

export const register = async (req, res) => {
  try {
    const profilePicture = req.files?.profilePicture?.[0];
    const validId = req.files?.validId?.[0];
    const proofOfIncome = req.files?.proofOfIncome?.[0];

    let profilePictureUrl = null;
    let validIdUrl = null;
    let proofOfIncomeUrl = null;
    if (profilePicture) {
      profilePictureUrl = await uploadHandler(profilePicture.buffer, "profile");
    }
    if (validId) {
      validIdUrl = await uploadHandler(validId.buffer, "validId");
    }

    if (proofOfIncome) {
      proofOfIncomeUrl = await uploadHandler(
        proofOfIncome.buffer,
        "proofOfIncome",
      );
    }

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
      profilePicture: profilePictureUrl,
      firstName,
      lastName,
      contactNumber,
      validId: validIdUrl,
      proofOfIncome: proofOfIncomeUrl,
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
