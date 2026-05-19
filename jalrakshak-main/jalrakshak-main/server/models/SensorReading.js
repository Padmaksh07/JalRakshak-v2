const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
  {
    zone:          { type: String, required: true, index: true },
    deviceId:      { type: String, required: true },
    ph:            { type: Number, required: true },
    turbidity:     { type: Number, required: true },
    contamination: { type: Number, required: true },
    rainfall:      { type: Number, required: true },   // real IMD/Open-Meteo value if available
    dissolvedO2:   { type: Number },
    temperature:   { type: Number },
    ecoli:         { type: Number },
    signalStrength:{ type: Number },   // IoT device signal quality (dBm simulated)
    batteryLevel:  { type: Number },   // IoT device battery %
    rainfallSource:{ type: String, enum: ["openmeteo", "simulated"], default: "simulated" },
  },
  {
    // createdAt is the reading timestamp — indexed for range queries
    timestamps: true,
  }
);

// TTL index: auto-delete readings older than 7 days to keep DB lean
sensorReadingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

// Compound index for efficient history queries
sensorReadingSchema.index({ zone: 1, createdAt: -1 });

module.exports = mongoose.model("SensorReading", sensorReadingSchema);
