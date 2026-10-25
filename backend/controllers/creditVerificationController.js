import { cloudConf } from "../config/cloudinary.js";
import CreditVerification from "../model/CreditVerification.js";

const uploadDocument = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudConf.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          publicId: result.public_id,
          url: result.secure_url,
          originalName: file.originalname,
        });
      },
    );
    stream.end(file.buffer);
  });

const purgeDocument = async (document) => {
  if (!document?.publicId) return;
  await cloudConf.uploader.destroy(document.publicId);
};

export const getMyCreditVerification = async (req, res) => {
  try {
    const verification = await CreditVerification.findOne({ user: req.user._id })
      .select("-governmentId -proofOfIncome")
      .populate("reviewedBy", "firstName lastName")
      .lean();

    return res.status(200).json({ success: true, verification });
  } catch (error) {
    console.error("getMyCreditVerification error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load credit verification",
    });
  }
};

export const submitCreditVerification = async (req, res) => {
  const governmentId = req.files?.governmentId?.[0];
  const proofOfIncome = req.files?.proofOfIncome?.[0];

  if (!governmentId || !proofOfIncome) {
    return res.status(400).json({
      success: false,
      message: "A government ID and proof of income are required",
    });
  }

  const existing = await CreditVerification.findOne({ user: req.user._id });
  if (existing?.status === "pending" || existing?.status === "approved") {
    return res.status(409).json({
      success: false,
      message: `Your credit verification is already ${existing.status}`,
    });
  }

  try {
    if (existing) {
      await Promise.all([
        purgeDocument(existing.governmentId),
        purgeDocument(existing.proofOfIncome),
      ]);
    }

    const [idDocument, incomeDocument] = await Promise.all([
      uploadDocument(governmentId, "credit-verification/government-id"),
      uploadDocument(proofOfIncome, "credit-verification/proof-of-income"),
    ]);

    const verification = existing
      ? await CreditVerification.findOneAndUpdate(
          { user: req.user._id },
          {
            governmentId: idDocument,
            proofOfIncome: incomeDocument,
            status: "pending",
            rejectionReason: undefined,
            reviewedBy: undefined,
            reviewedAt: undefined,
          },
          { new: true, runValidators: true },
        )
      : await CreditVerification.create({
          user: req.user._id,
          governmentId: idDocument,
          proofOfIncome: incomeDocument,
        });

    return res.status(existing ? 200 : 201).json({
      success: true,
      message: "Credit verification submitted for review",
      verification: await CreditVerification.findById(verification._id)
        .select("-governmentId -proofOfIncome")
        .lean(),
    });
  } catch (error) {
    console.error("submitCreditVerification error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit credit verification",
    });
  }
};

export const listCreditVerifications = async (req, res) => {
  const status = ["pending", "approved", "rejected"].includes(req.query.status)
    ? req.query.status
    : undefined;
  const filter = status ? { status } : {};

  const verifications = await CreditVerification.find(filter)
    .select("-governmentId -proofOfIncome")
    .populate("user", "firstName lastName email contactNumber")
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ success: true, verifications });
};

export const getCreditVerificationDocuments = async (req, res) => {
  const verification = await CreditVerification.findById(req.params.id)
    .populate("user", "firstName lastName email contactNumber")
    .lean();

  if (!verification) {
    return res.status(404).json({
      success: false,
      message: "Credit verification not found",
    });
  }

  return res.status(200).json({ success: true, verification });
};

const reviewVerification = (status) => async (req, res) => {
  const verification = await CreditVerification.findById(req.params.id);
  if (!verification) {
    return res.status(404).json({
      success: false,
      message: "Credit verification not found",
    });
  }
  if (verification.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: `Verification is already ${verification.status}`,
    });
  }

  verification.status = status;
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();
  verification.rejectionReason =
    status === "rejected" ? req.body.rejectionReason?.trim() || "Documents did not meet verification requirements" : undefined;
  await verification.save();

  if (status === "approved") {
    await Promise.all([
      purgeDocument(verification.governmentId),
      purgeDocument(verification.proofOfIncome),
    ]);
    verification.governmentId = undefined;
    verification.proofOfIncome = undefined;
    await verification.save();
  }

  return res.status(200).json({
    success: true,
    message: `Credit verification ${status}`,
    verification: await CreditVerification.findById(verification._id)
      .select("-governmentId -proofOfIncome")
      .populate("user", "firstName lastName email contactNumber")
      .lean(),
  });
};

export const approveCreditVerification = reviewVerification("approved");
export const rejectCreditVerification = reviewVerification("rejected");
