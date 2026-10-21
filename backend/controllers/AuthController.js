import bcrypt from "bcrypt";
import User from "../model/User.js";
import Address from "../model/Address.js";
import { cloudConf } from "../config/cloudinary.js";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";

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
const DUMMY_PASSWORD_HASH =
  "$2b$10$7EqJtq98hPqEX7fNZaFWoOeYc4v5v5yQbO5B5H4a2B8h8Z9d9W6aK";

// Sign a JWT and send it as an httpOnly cookie, together with the user.
const sendToken = async (user, statusCode, res) => {
  const token = user.getJWTToken();
  const address = await Address.findOne({ userId: user._id }).lean();

  const cookieExpireDays =
    Number(process.env.COOKIE_EXPIRES_TIME || process.env.COOKIE_EXPIRE) || 7;
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
    address,
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
      isDefault: true,
    });

    return await sendToken(user, 201, res);
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

    const passwordMatches = user
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account has been deactivated. Contact support for assistance.",
        success: false,
      });
    }

    return await sendToken(user, 200, res);
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
export const getUserProfile = async (req, res) => {
  try {
    const address = await Address.findOne({ userId: req.user._id }).lean();

    return res.status(200).json({
      success: true,
      user: req.user,
      address,
    });
  } catch (error) {
    console.error("Failed to load user address:", error);
    return res.status(500).json({
      message: "Internal service error",
      success: false,
    });
  }
};

export const forgotPassword = (req, res) => {};

export const resetPassword = (req, res) => {};

/**
 * Quiz 4 (15 pts): Social login handler (Firebase / Google / Facebook)
 * Authenticates or automatically creates customer account using Firebase credentials
 */
export const firebaseLogin = async (req, res) => {
  try {
    const authorization = req.headers.authorization || "";
    const idToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase identity token is required",
      });
    }

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (error) {
      if (error.code === "FIREBASE_ADMIN_NOT_CONFIGURED") {
        return res.status(503).json({
          success: false,
          message: "Google sign-in is temporarily unavailable",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Unable to verify Google sign-in",
      });
    }

    if (!decodedToken.email || decodedToken.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: "Unable to verify Google sign-in",
      });
    }

    const user = await User.findOne({ email: decodedToken.email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: false,
        isRegistered: false,
        message:
          "This Google account is not registered yet. Please complete registration.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact support for assistance.",
      });
    }

    // Existing user: sign token and log in
    return await sendToken(user, 200, res);
  } catch (error) {
    console.error("Firebase authentication error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process Firebase authentication",
    });
  }
};
