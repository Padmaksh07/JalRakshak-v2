const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    zone:               { type: String, required: true, index: true },
    severity:           { type: String, enum: ["low", "medium", "high", "critical"], required: true },
    disease:            { type: String },
    message:            { type: String, required: true },
    hindiMessage:       { type: String },
    assameseMessage:    { type: String },
    sent:               { type: Boolean, default: false },
    smsCount:           { type: Number, default: 0 },
    simulated:          { type: Boolean, default: false },
    sentBy:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);
