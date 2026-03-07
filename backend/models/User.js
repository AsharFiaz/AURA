const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
    validate: {
      validator: function (v) {
        if (v && !v.startsWith("google_")) {
          return v.length >= 6;
        }
        return true;
      },
      message: "Password must be at least 6 characters long",
    },
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  // OCEAN personality vector
  personality: {
    O: { type: Number, default: null }, // Openness
    C: { type: Number, default: null }, // Conscientiousness
    E: { type: Number, default: null }, // Extraversion
    A: { type: Number, default: null }, // Agreeableness
    N: { type: Number, default: null }, // Neuroticism
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  profilePicture: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (this.password && this.password.startsWith("google_")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;