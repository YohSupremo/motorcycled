import mongoose from "mongoose";

const addressSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  street: {
    type: String,
    required: true,
  },
  barangay: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
});

const Address = mongoose.model("Address", addressSchema);
export default Address;
