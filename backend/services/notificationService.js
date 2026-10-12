import Notification from "../model/Notification.js";

/**
 * Send and persist notification (email + in_app ledger)
 */
export const sendNotification = async ({
  recipientId,
  type,
  subject,
  message,
  orderId = null,
  productId = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      channel: "email",
      type,
      subject,
      message,
      order: orderId,
      product: productId,
    });

    console.log(`[Notification/Email] Sent to user ${recipientId}: [${subject}]`);
    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error.message);
    return null;
  }
};

/**
 * Trigger order placed email notification
 */
export const notifyOrderPlaced = async (order, user) => {
  const subject = `MotorCycled Order Confirmation — ${order.orderNumber}`;
  const itemsText = (order.orderItems || [])
    .map((i) => `• ${i.quantity}x ${i.name} — ₱${(i.price * i.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}`)
    .join("\n");

  const message = `Dear ${user.firstName || "Customer"},\n\n` +
    `Thank you for your order with MotorCycled!\n\n` +
    `Order Number: ${order.orderNumber}\n` +
    `Fulfillment: ${order.shippingInfo?.fulfillmentMethod === "delivery" ? "Door-to-Door Delivery" : "Dealership Pickup"}\n` +
    `Destination: ${order.shippingInfo?.address || order.shippingInfo?.branch || "Showroom"}\n` +
    `Payment Method: ${order.paymentMethod?.replace(/_/g, " ")}\n` +
    `Payment Status: ${order.paymentStatus}\n` +
    `Total Amount: ₱${order.totalPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n\n` +
    `Items:\n${itemsText}\n\n` +
    `You can track your order status in your MotorCycled Account under My Orders.`;

  return sendNotification({
    recipientId: user._id,
    type: "order_summary",
    subject,
    message,
    orderId: order._id,
  });
};

/**
 * Trigger installment application status notification
 */
export const notifyInstallmentUpdate = async (application, user, status, reason = "") => {
  const isApproved = status === "approved";
  const subject = `MotorCycled Installment Application ${application.applicationRef} — ${isApproved ? "Approved" : "Update"}`;
  
  let message = `Dear ${user.firstName || "Applicant"},\n\n` +
    `Your installment application for ${application.productName} (${application.applicationRef}) has been ${isApproved ? "APPROVED" : "REJECTED"}.\n\n`;

  if (isApproved) {
    message += `Confirmed Financing Terms:\n` +
      `• Term: ${application.termMonths} Months\n` +
      `• Downpayment: ₱${Number(application.downPayment).toLocaleString()}\n` +
      `• Monthly Amortization: ₱${Number(application.monthlyPayment).toLocaleString()}/mo\n\n` +
      `Please visit the dealership or contact our sales department to complete your downpayment collection.`;
  } else {
    message += `Reason: ${reason || "Credit requirements not met"}\n\n` +
      `Feel free to contact our customer support for inquiries or explore cash purchase options.`;
  }

  return sendNotification({
    recipientId: user._id,
    type: isApproved ? "installment_approved" : "installment_rejected",
    subject,
    message,
  });
};
