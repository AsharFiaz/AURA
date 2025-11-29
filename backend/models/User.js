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
    required: false, // Made optional to support OAuth users
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
    validate: {
      validator: function (v) {
        // If password exists and doesn't start with 'google_', it must be at least 6 chars
        if (v && !v.startsWith("google_")) {
          return v.length >= 6;
        }
        return true; // OAuth users or no password is valid
      },
      message: "Password must be at least 6 characters long",
    },
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  interests: {
    type: [String],
    default: [],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: "Interests array cannot have more than 3 items",
    },
  },
  emotions: {
    type: [String],
    default: [],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: "Emotions array cannot have more than 3 items",
    },
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
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }

  // Skip hashing for OAuth users (passwords starting with 'google_')
  if (this.password && this.password.startsWith("google_")) {
    return;
  }

  // Hash password with cost of 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
