import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../model/User.js";
import Address from "../model/Address.js";
import { cloudConf } from "../config/cloudinary.js";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";
import { sendOrderStatusEmail } from "../services/emailService.js";

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

    let profilePictureUrl = null;
    if (profilePicture) {
      profilePictureUrl = await uploadHandler(profilePicture.buffer, "profile");
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

    const normalizedEmail = email?.trim().toLowerCase();
    const hashedpassword = await bcrypt.hash(password, 10);

    const isExisting = await User.findOne({
      email: normalizedEmail,
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
      email: normalizedEmail,
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

export const checkEmailAvailability = async (req, res) => {
  const email = req.query.email?.trim().toLowerCase();
  if (!email) {
    return res.status(200).json({ success: true, available: false });
  }

  const existingUser = await User.exists({ email });
  return res.status(200).json({
    success: true,
    available: !existingUser,
  });
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
      if (user.deactivationSource === "self") {
        return res.status(403).json({
          message: "This account was deactivated by you and can be reactivated.",
          canReactivate: true,
          success: false,
        });
      }

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

export const reactivateOwnAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or contact number and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { contactNumber: email.trim() }],
    });

    const passwordMatches = user
      ? await user.comparePassword(password || "")
      : await bcrypt.compare(password || "", DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isActive || user.deactivationSource !== "self") {
      return res.status(403).json({
        success: false,
        message: "This account cannot be reactivated here. Contact support for assistance.",
      });
    }

    user.isActive = true;
    user.deactivationSource = "none";
    await user.save();

    return await sendToken(user, 200, res);
  } catch (error) {
    console.error("Reactivate own account error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal service error",
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/password/reset/${resetToken}`;

    const customerName = `${user.firstName || "Rider"} ${user.lastName || ""}`.trim();
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
    <tr>
      <td style="background-color: #ffffff; padding: 24px 32px; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align: middle;">
              <div style="font-size: 18px; font-weight: 800; color: #047857; letter-spacing: 1.2px; text-transform: uppercase;">MOTORCYCLED</div>
              <div style="font-size: 10px; font-weight: 600; color: #71717a; letter-spacing: 0.6px; margin-top: 2px;">PASSWORD RESET</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 28px 32px;">
        <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #18181b; letter-spacing: -0.3px;">Reset your password</h1>
        <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.7; color: #52525b;">Hi ${customerName},</p>
        <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.7; color: #52525b;">We received a request to reset the password for your Motorcycled account. Tap the button below to create a new password. This link will expire in <strong>15 minutes</strong>.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: #047857;">
              <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px; text-transform: uppercase;">Reset Password</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.7; color: #71717a;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.6; word-break: break-all;"><a href="${resetUrl}" style="color: #047857; text-decoration: none;">${resetUrl}</a></p>
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #71717a;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 18px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #a1a1aa;">© ${new Date().getFullYear()} MotorCycled Dealership. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Motorcycled - Password Reset Request

Hi ${customerName},

We received a request to reset the password for your Motorcycled account.

Reset your password (valid for 15 minutes):
${resetUrl}

If you didn't request this, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} MotorCycled Dealership
    `.trim();

    try {
      const nodemailer = (await import("nodemailer")).default;
      const host = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
      const port = Number(process.env.SMTP_PORT) || 2525;
      const smtpUser = process.env.SMTP_EMAIL || process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

      let transporter;
      if (smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
          host,
          port,
          auth: { user: smtpUser, pass: smtpPass },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || "MotorCycled Dealership"}" <${process.env.SMTP_FROM_EMAIL || "noreply@motorcycled.ph"}>`,
        to: user.email,
        subject: "Motorcycled - Reset your password",
        text: textContent,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Auth] Password reset email sent to ${user.email}: ${info.messageId}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`[Auth] Preview: ${previewUrl}`);
    } catch (emailError) {
      console.error("[Auth] Failed to send password reset email:", emailError.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal service error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired",
      });
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter and confirm your new password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal service error",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all password fields",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal service error",
    });
  }
};

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
      if (user.deactivationSource === "self") {
        if (req.body?.reactivate === true) {
          user.isActive = true;
          user.deactivationSource = "none";
          await user.save();
          return await sendToken(user, 200, res);
        }

        return res.status(403).json({
          success: false,
          canReactivate: true,
          message: "This account was deactivated by you and can be reactivated.",
        });
      }

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
