import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

/**
 * Generate a PDF invoice/receipt Buffer for an order.
 * @param {Object} order - Populated Order document
 * @param {Object} user - Customer User document or object
 * @returns {Promise<Buffer>}
 */
export const generateOrderInvoicePDF = (order, user = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Receipt - ${order.orderNumber}`,
          Author: "MotorCycled Dealership",
          Subject: `Official Invoice for Order ${order.orderNumber}`,
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const customerName = `${user?.firstName || order.shippingInfo?.recipientName || "Customer"} ${user?.lastName || ""}`.trim();
      const customerEmail = user?.email || order.shippingInfo?.email || "—";
      const customerPhone = order.shippingInfo?.contactNumber || user?.contactNumber || "—";
      const fulfillment =
        order.shippingInfo?.fulfillmentMethod === "delivery"
          ? "Door-to-Door Delivery"
          : "Dealership Pickup";
      const address =
        order.shippingInfo?.address ||
        order.shippingInfo?.branch ||
        "Showroom Releasing";
      const cityPostal = [order.shippingInfo?.city, order.shippingInfo?.postalCode]
        .filter(Boolean)
        .join(" ");

      const formatPHP = (val) =>
        `PHP ${Number(val || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString(
        "en-PH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      // ─── Header with Official Dealership Logo ──────────────────────────────
      const logoPath = path.resolve("assets/logo-sm.png");
      const hasLogo = fs.existsSync(logoPath);

      if (hasLogo) {
        doc.image(logoPath, 40, 36, { fit: [44, 44] });
        doc.fillColor("#047857").fontSize(20).font("Helvetica-Bold").text("MOTORCYCLED", 92, 38);
        doc.fillColor("#71717a").fontSize(8.5).font("Helvetica").text("Dealership, OEM Parts & Service Hub", 92, 60);
        doc.text("Metro Manila, Philippines · Official Transaction Invoice", 92, 72);
      } else {
        doc.fillColor("#047857").fontSize(22).font("Helvetica-Bold").text("MOTORCYCLED", 40, 40);
        doc.fillColor("#71717a").fontSize(9).font("Helvetica").text("Dealership, OEM Parts & Service Hub", 40, 68);
        doc.text("Metro Manila, Philippines · Official Transaction Receipt", 40, 80);
      }

      // Invoice metadata on right
      doc.fillColor("#18181b").fontSize(13).font("Helvetica-Bold").text(order.orderNumber, 320, 38, { align: "right", width: 235 });
      doc.fillColor("#71717a").fontSize(8.5).font("Helvetica").text(`Date: ${dateStr}`, 320, 56, { align: "right", width: 235 });
      doc.text(`Status: ${(order.orderStatus || "PENDING").toUpperCase()}`, 320, 68, { align: "right", width: 235 });
      doc.text(`Payment: ${(order.paymentStatus || "PENDING").toUpperCase()}`, 320, 80, { align: "right", width: 235 });

      // Horizontal separator line
      doc.strokeColor("#e4e4e7").lineWidth(1).moveTo(40, 96).lineTo(555, 96).stroke();

      // ─── Customer & Order Info Section ──────────────────────────────────────
      const infoTop = 108;
      // Left: Billed / Delivered To
      doc.fillColor("#047857").fontSize(9).font("Helvetica-Bold").text("BILLED / DELIVERED TO", 40, infoTop);
      doc.fillColor("#18181b").fontSize(10).font("Helvetica-Bold").text(customerName, 40, infoTop + 14);
      doc.fillColor("#52525b").fontSize(9).font("Helvetica");
      doc.text(customerEmail, 40, infoTop + 28);
      doc.text(customerPhone, 40, infoTop + 40);
      doc.text(address, 40, infoTop + 52);
      if (cityPostal) {
        doc.text(cityPostal, 40, infoTop + 64);
      }

      // Right: Fulfillment & Method
      const rightColX = 320;
      doc.fillColor("#047857").fontSize(9).font("Helvetica-Bold").text("FULFILLMENT & PAYMENT", rightColX, infoTop);
      doc.fillColor("#18181b").fontSize(10).font("Helvetica-Bold").text(fulfillment, rightColX, infoTop + 14);
      doc.fillColor("#52525b").fontSize(9).font("Helvetica");
      doc.text(`Method: ${(order.paymentMethod || "").replace(/_/g, " ").toUpperCase()}`, rightColX, infoTop + 28);
      doc.text(`Destination: ${address}`, rightColX, infoTop + 40, { width: 235 });
      if (order.paidAt) {
        doc.text(`Paid At: ${new Date(order.paidAt).toLocaleDateString("en-PH")}`, rightColX, infoTop + 52);
      }

      // ─── Items Table Header ─────────────────────────────────────────────────
      const tableTop = 205;
      doc.rect(40, tableTop, 515, 22).fill("#f4f4f5");

      doc.fillColor("#71717a").fontSize(8).font("Helvetica-Bold");
      doc.text("ITEM DESCRIPTION", 48, tableTop + 6);
      doc.text("QTY", 290, tableTop + 6, { width: 40, align: "center" });
      doc.text("UNIT PRICE", 345, tableTop + 6, { width: 95, align: "right" });
      doc.text("AMOUNT", 450, tableTop + 6, { width: 95, align: "right" });

      // ─── Items Table Rows ───────────────────────────────────────────────────
      let rowY = tableTop + 26;
      const items = order.orderItems || [];

      items.forEach((item, index) => {
        // Light separator between rows
        if (index > 0) {
          doc.strokeColor("#f4f4f5").lineWidth(0.5).moveTo(40, rowY - 6).lineTo(555, rowY - 6).stroke();
        }

        const itemName = item.name || "Product Item";
        
        // Render item name cleanly without conflicting tags
        doc.fillColor("#18181b").fontSize(9).font("Helvetica-Bold");
        const nameHeight = doc.heightOfString(itemName, { width: 235 });
        doc.text(itemName, 48, rowY, { width: 235 });

        // Quantity, Unit Price, and Amount
        doc.fillColor("#18181b").fontSize(9).font("Helvetica").text(String(item.quantity || 1), 290, rowY, { width: 40, align: "center" });
        doc.text(formatPHP(item.price), 345, rowY, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").text(formatPHP((item.price || 0) * (item.quantity || 1)), 450, rowY, { width: 95, align: "right" });

        // Advance rowY dynamically based on item name wrapping height
        const rowHeight = Math.max(nameHeight + 10, 24);
        rowY += rowHeight;
      });

      // Bottom border of items table
      doc.strokeColor("#e4e4e7").lineWidth(1).moveTo(40, rowY + 4).lineTo(555, rowY + 4).stroke();

      // ─── Totals Section ─────────────────────────────────────────────────────
      const totalsY = rowY + 16;
      const vat = (order.itemsPrice || 0) * 0.12;

      const totalsBoxX = 330;
      const totalsBoxWidth = 225;

      const renderTotalRow = (label, value, y, isBold = false, isAccent = false) => {
        doc.fillColor(isAccent ? "#047857" : isBold ? "#18181b" : "#71717a")
          .fontSize(isBold ? 10 : 9)
          .font(isBold ? "Helvetica-Bold" : "Helvetica")
          .text(label, totalsBoxX, y);
        doc.text(value, totalsBoxX, y, { width: totalsBoxWidth, align: "right" });
      };

      renderTotalRow("Subtotal:", formatPHP(order.itemsPrice), totalsY);
      renderTotalRow(
        "Shipping / Delivery:",
        order.shippingPrice > 0 ? formatPHP(order.shippingPrice) : "FREE (PHP 0.00)",
        totalsY + 16
      );
      renderTotalRow("VAT (12% Included):", formatPHP(vat), totalsY + 32);

      // Line before total
      doc.strokeColor("#18181b").lineWidth(1.5).moveTo(totalsBoxX, totalsY + 48).lineTo(555, totalsY + 48).stroke();
      renderTotalRow("Total Amount:", formatPHP(order.totalPrice), totalsY + 54, true, true);

      // ─── Footer ─────────────────────────────────────────────────────────────
      const footerY = 720;
      doc.strokeColor("#e4e4e7").lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke();
      doc.fillColor("#a1a1aa").fontSize(8).font("Helvetica")
        .text(
          "Official system receipt generated by MotorCycled E-Commerce platform. All motorcycles carry genuine manufacturer warranties, safety inspections, and LTO registration support.",
          40,
          footerY + 10,
          { align: "center", width: 515 }
        );
      doc.text("For customer inquiries or warranty service, contact support@motorcycled.ph or visit our dealership center.", 40, footerY + 24, { align: "center", width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
