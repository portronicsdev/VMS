const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Phone must be 10 digits"]
    },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", visitorSchema);
