const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", required: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Phone must be 10 digits"]
    },
    name: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    personToMeet: { type: String, required: true, trim: true },
    photoUrl: { type: String, trim: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date },
    status: { type: String, enum: ["active", "completed"], default: "active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visit", visitSchema);
