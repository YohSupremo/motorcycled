import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

/**
 * Creates and returns a nodemailer transporter.
 * Uses environment variables or creates an Ethereal test account if credentials are empty.
 */
const getTransporter = async () => {
  const host = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
  const port = Number(process.env.SMTP_PORT) || 2525;
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }

  // If credentials are blank in .env, attempt to use Ethereal or return null
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log("[EmailService] Using temporary Ethereal SMTP test account:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    console.warn("[EmailService] Ethereal fallback failed, email will be logged to console:", err.message);
    return null;
  }
};

/**
 * Format currency in Philippine Peso.
 */
const formatPHP = (val) =>
  `₱${Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Human-readable status mapping.
 */
const STATUS_LABELS = {
  pending: "Pending Confirmation",
  processing: "Processing",
  ready_for_pickup: "Ready for Pickup",
  shipped: "Shipped",
  completed: "Completed",
  canceled: "Cancelled",
};

/**
 * Sends a clean, minimal order status update email with an item list, subtotal, total, and PDF attachment.
 * Adheres to clean-ui rules: single accent, no unnecessary pills/tags, no duplicate order numbers, no cold blue-slate tints.
 * @param {Object} params
 * @param {Object} params.order - Populated Order document
 * @param {Object} params.user - Customer user document
 * @param {string} params.newStatus - The updated orderStatus string
 * @param {Buffer} params.pdfBuffer - PDF invoice buffer to attach
 * @returns {Promise<{ success: boolean, messageId?: string, previewUrl?: string }>}
 */
export const sendOrderStatusEmail = async ({
  order,
  user,
  newStatus,
  pdfBuffer,
}) => {
  const recipientEmail = user?.email || order.shippingInfo?.email;
  if (!recipientEmail) {
    console.warn(`[EmailService] No recipient email found for order ${order.orderNumber}`);
    return { success: false, reason: "No recipient email" };
  }

  const customerName = `${user?.firstName || order.shippingInfo?.recipientName || "Valued Rider"} ${user?.lastName || ""}`.trim();
  const customerPhone = order.shippingInfo?.contactNumber || user?.contactNumber || "—";
  const statusLabel = STATUS_LABELS[newStatus] || (newStatus || "Updated").toUpperCase();
  const address =
    order.shippingInfo?.address ||
    order.shippingInfo?.branch ||
    "Showroom Releasing";
  const fulfillment =
    order.shippingInfo?.fulfillmentMethod === "delivery"
      ? "Door-to-Door Delivery"
      : "Dealership Pickup";
  const paymentMethodLabel = (order.paymentMethod || "").replace(/_/g, " ");
  const paymentStatusLabel = (order.paymentStatus || "PENDING").toUpperCase();

  const subject = `Order ${order.orderNumber}: ${statusLabel}`;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Dynamic status badges and messaging
  let statusBadgeBg = "#fffbeb";
  let statusBadgeText = "#b45309";
  let statusBadgeBorder = "#fcd34d";
  let statusDescription = "Your order has been logged in our dealership system and is awaiting confirmation.";

  if (newStatus === "processing") {
    statusBadgeBg = "#f4f4f5";
    statusBadgeText = "#18181b";
    statusBadgeBorder = "#d4d4d8";
    statusDescription = "Our warehouse technicians are preparing and packing your ordered items.";
  } else if (newStatus === "ready_for_pickup") {
    statusBadgeBg = "#f0fdf4";
    statusBadgeText = "#15803d";
    statusBadgeBorder = "#86efac";
    statusDescription = "Your order is ready for pickup at our dealership releasing showroom.";
  } else if (newStatus === "shipped") {
    statusBadgeBg = "#f0fdf4";
    statusBadgeText = "#047857";
    statusBadgeBorder = "#86efac";
    statusDescription = "Your order has been dispatched with our logistics courier.";
  } else if (newStatus === "completed") {
    statusBadgeBg = "#ecfdf5";
    statusBadgeText = "#047857";
    statusBadgeBorder = "#6ee7b7";
    statusDescription = "Order completed and delivered successfully. Thank you for choosing MotorCycled!";
  } else if (newStatus === "canceled") {
    statusBadgeBg = "#fef2f2";
    statusBadgeText = "#b91c1c";
    statusBadgeBorder = "#fca5a5";
    statusDescription = "This order has been cancelled. For refunds or inquiries, please contact our support team.";
  }

  const isPaid = order.paymentStatus === "paid";
  const paymentBadgeBg = isPaid ? "#ecfdf5" : "#fffbeb";
  const paymentBadgeText = isPaid ? "#047857" : "#b45309";
  const paymentBadgeBorder = isPaid ? "#6ee7b7" : "#fcd34d";

  // Check if logo is available
  const logoPath = path.resolve("assets/logo-sm.png");
  const hasLogo = fs.existsSync(logoPath);

  // 4-column structured table with alternating row tints
  const itemsHtml = (order.orderItems || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #f4f4f5; background-color: ${idx % 2 === 0 ? "#ffffff" : "#fafafa"};">
        <td style="padding: 12px 16px; font-size: 13px; color: #18181b; vertical-align: middle;">
          <div style="font-weight: 700; color: #18181b; line-height: 1.4;">${item.name}</div>
        </td>
        <td style="padding: 12px 14px; font-size: 13px; text-align: center; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; vertical-align: middle;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 14px; font-size: 13px; text-align: right; color: #71717a; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; vertical-align: middle;">
          ${formatPHP(item.price)}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; font-weight: 700; color: #18181b; vertical-align: middle;">
          ${formatPHP((item.price || 0) * (item.quantity || 1))}
        </td>
      </tr>`
    )
    .join("");

  // Plain text fallback
  const itemsText = (order.orderItems || [])
    .map((i) => `  • ${i.quantity}x ${i.name} — ${formatPHP(i.price * i.quantity)}`)
    .join("\n");

  const vat = (order.itemsPrice || 0) * 0.12;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-top: 4px solid #047857; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    
    <!-- Clean Dealership Brand Receipt Header -->
    <tr>
      <td style="background-color: #ffffff; padding: 22px 28px; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align: middle;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  ${hasLogo
      ? `
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="cid:motorcycled-logo" alt="MotorCycled" width="38" height="38" style="display: block; border-radius: 4px;" />
                  </td>`
      : ""
    }
                  <td style="vertical-align: middle;">
                    <div style="font-size: 18px; font-weight: 800; color: #047857; letter-spacing: 1.2px; text-transform: uppercase; line-height: 1.2;">
                      MOTORCYCLED
                    </div>
                    <div style="font-size: 10.5px; font-weight: 600; color: #71717a; letter-spacing: 0.6px; margin-top: 2px;">
                      OFFICIAL TRANSACTION RECEIPT
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="display: inline-block; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; padding: 6px 12px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; font-size: 12px; font-weight: 700; color: #18181b; letter-spacing: 0.5px;">
                  #${order.orderNumber}
                </span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px 28px 24px 28px;">
        
        <!-- Order Status & Customer Greeting -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td>
              <div style="display: inline-block; margin-bottom: 10px;">
                <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; border-radius: 4px; background-color: ${statusBadgeBg}; color: ${statusBadgeText}; border: 1px solid ${statusBadgeBorder};">
                  ${statusLabel}
                </span>
              </div>
              <h1 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 800; color: #18181b; letter-spacing: -0.4px; line-height: 1.25;">
                Thank you for your order, ${customerName}
              </h1>
              <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #52525b;">
                ${statusDescription}
              </p>
            </td>
          </tr>
        </table>

        <!-- Dual Details Grid (Fulfillment & Payment) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
          <tr>
            <td width="48%" style="vertical-align: top; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 16px 18px;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 6px;">
                DELIVERY DETAILS
              </div>
              <div style="font-size: 14px; font-weight: 700; color: #18181b; line-height: 1.4; margin-bottom: 4px;">
                ${customerName}
              </div>
              <div style="font-size: 13px; color: #3f3f46; line-height: 1.45; margin-bottom: 6px;">
                ${address}
              </div>
              <div style="font-size: 12px; color: #71717a; line-height: 1.4;">
                <span style="font-weight: 600; color: #52525b;">${fulfillment}</span><br />
                Contact: ${customerPhone}
              </div>
            </td>
            <td width="4%"></td>
            <td width="48%" style="vertical-align: top; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 16px 18px;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 6px;">
                PAYMENT INFORMATION
              </div>
              <div style="font-size: 14px; font-weight: 700; color: #18181b; text-transform: capitalize; margin-bottom: 6px;">
                ${paymentMethodLabel}
              </div>
              <div style="margin-bottom: 8px;">
                <span style="display: inline-block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 3px; background-color: ${paymentBadgeBg}; color: ${paymentBadgeText}; border: 1px solid ${paymentBadgeBorder};">
                  ${paymentStatusLabel}
                </span>
              </div>
              <div style="font-size: 12px; color: #71717a; line-height: 1.4;">
                Date: ${dateStr}<br />
                Receipt: Attached PDF
              </div>
            </td>
          </tr>
        </table>

        <!-- Ordered Items Title -->
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 10px;">
          ORDER BREAKDOWN
        </div>

        <!-- 4-Column Items Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #fafafa; border-bottom: 1.5px solid #e4e4e7;">
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.4px;">Item Description</th>
              <th style="padding: 10px 14px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.4px; width: 50px;">Qty</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.4px; width: 90px;">Unit Price</th>
              <th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; letter-spacing: 0.4px; width: 95px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
          <tr>
            <td style="vertical-align: top; padding-right: 20px;">
              <div style="font-size: 11.5px; color: #71717a; line-height: 1.5; padding-top: 6px;">
                Prices include all government sales tax and applicable dealership handling fees. Official BIR tax receipt is attached.
              </div>
            </td>
            <td width="270" style="vertical-align: top;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 14px 16px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 12.5px; color: #71717a;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; font-weight: 600; color: #18181b;">${formatPHP(order.itemsPrice)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 12.5px; color: #71717a;">Delivery Fee</td>
                  <td style="padding: 4px 0; font-size: 13px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; font-weight: 600; color: #18181b;">
                    ${order.shippingPrice > 0 ? formatPHP(order.shippingPrice) : "FREE"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 12.5px; color: #71717a;">VAT (12% Included)</td>
                  <td style="padding: 4px 0; font-size: 12px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; color: #71717a;">${formatPHP(vat)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0 6px 0;">
                    <div style="border-top: 1.5px solid #18181b;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 800; color: #18181b;">Total Amount</td>
                  <td style="padding: 4px 0; font-size: 18px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; font-weight: 800; color: #047857;">
                    ${formatPHP(order.totalPrice)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Attached Receipt Callout Box & Action Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 18px;">
          <tr>
            <td style="vertical-align: middle;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <div style="width: 36px; height: 36px; background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 6px; text-align: center; line-height: 36px; font-size: 18px;">
                      📄
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 13px; font-weight: 700; color: #14532d; line-height: 1.3;">
                      Official PDF Receipt Attached
                    </div>
                    <div style="font-size: 12px; color: #166534; font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; margin-top: 2px;">
                      Receipt-${order.orderNumber}.pdf
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <a href="${frontendUrl}/orders" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 10px 18px; border-radius: 5px; letter-spacing: 0.3px; text-transform: uppercase;">
                View Order →
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Dealership Guarantee & Support Footer -->
    <tr>
      <td style="padding: 20px 28px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 11px; color: #71717a; line-height: 1.6;">
              <strong style="color: #18181b;">MotorCycled Dealership Operations</strong><br />
              Metro Manila, Philippines · Official Sales & Distribution Center<br />
              Need assistance? Email us at <a href="mailto:support@motorcycled.ph" style="color: #047857; text-decoration: none; font-weight: 600;">support@motorcycled.ph</a>
            </td>
            <td style="text-align: right; vertical-align: bottom; font-size: 11px; color: #a1a1aa;">
              Genuine OEM Parts & Warranties
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
MOTORCYCLED — ORDER ${order.orderNumber}
Status: ${statusLabel}

Hello ${customerName},

Here is your order receipt and delivery details.

ITEMS:
${itemsText}

Subtotal: ${formatPHP(order.itemsPrice)}
Shipping: ${order.shippingPrice > 0 ? formatPHP(order.shippingPrice) : "FREE"}
Total: ${formatPHP(order.totalPrice)}

Deliver To: ${address} (${fulfillment})
Payment: ${paymentMethodLabel} (${paymentStatusLabel})

An official PDF receipt (Receipt-${order.orderNumber}.pdf) is attached to this email.

MotorCycled Dealership Operations
  `.trim();

  const attachments = [];
  if (hasLogo) {
    attachments.push({
      filename: "logo-sm.png",
      path: logoPath,
      cid: "motorcycled-logo",
    });
  }
  if (pdfBuffer) {
    attachments.push({
      filename: `Receipt-${order.orderNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "MotorCycled Dealership"}" <${process.env.SMTP_FROM_EMAIL || "noreply@motorcycled.ph"}>`,
    to: recipientEmail,
    subject,
    text: textContent,
    html: htmlContent,
    attachments,
  };

  try {
    const transporter = await getTransporter();

    if (!transporter) {
      console.log(
        `[EmailService] (Simulated) Email prepared for ${recipientEmail} with PDF attachment (${pdfBuffer ? pdfBuffer.length : 0} bytes). Subject: [${subject}]`
      );
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${recipientEmail}: ${info.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] View preview at: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};
