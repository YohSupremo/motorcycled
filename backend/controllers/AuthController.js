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

const isProd = process.env.NODE_ENV === "production";

// Sign a JWT and send it as an httpOnly cookie, together with the user.
const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7;
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  };

  user.password = undefined;

  return res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
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

    // Never expose the hashed password in the response.
    user.password = undefined;

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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email & password",
        success: false,
      });
    }

    // Allow logging in with either the email or the contact number.
    const user = await User.findOne({
      $or: [{ email }, { contactNumber: email }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    return sendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal service error",
      success: false,
    });
  }
};

export const logout = (_req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Returns the currently authenticated user (set by the auth middleware).
export const getUserProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const forgotPassword = (req, res) => {};

export const resetPassword = (req, res) => {};
