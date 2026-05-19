/**
 * /api/reports  —  PDF report generation
 */

const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Alert = require("../models/Alert");
const SensorReading = require("../models/SensorReading");

// ── GET /api/reports/pdf?days=7  ──────────────────────────────────────────────
router.get("/pdf", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const alerts = await Alert.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 });
    const readings = await SensorReading.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50);

    // Create PDF document
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="JalRakshak-Report-${new Date().toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text("JalRakshak – Water Quality Report", { align: "center" });
    doc.fontSize(12).text(`Report Period: Last ${days} days`, { align: "center" });
    doc.moveDown();

    // Alerts Summary
    doc.fontSize(14).font("Helvetica-Bold").text("Alerts Summary");
    if (alerts.length === 0) {
      doc.fontSize(11).text("No alerts in this period.");
    } else {
      alerts.forEach((alert, i) => {
        doc.fontSize(11).text(`${i + 1}. [${alert.severity.toUpperCase()}] ${alert.zone}`);
        doc.fontSize(10).text(`   ${alert.message}`, { indent: 20 });
        doc.fontSize(9).text(`   Sent: ${alert.createdAt.toLocaleDateString()}`, { indent: 20 });
      });
    }
    doc.moveDown();

    // Sensor Readings Summary
    doc.fontSize(14).font("Helvetica-Bold").text("Recent Sensor Readings");
    if (readings.length === 0) {
      doc.fontSize(11).text("No readings available.");
    } else {
      readings.slice(0, 10).forEach((reading, i) => {
        doc.fontSize(10).text(`${i + 1}. ${reading.zone} – pH: ${reading.ph.toFixed(2)}, Turbidity: ${reading.turbidity.toFixed(1)}, Contamination: ${reading.contamination.toFixed(1)}%`);
      });
    }
    doc.moveDown();

    // Footer
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
