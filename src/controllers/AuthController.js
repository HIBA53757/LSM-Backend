import User from "../models/User.js";
import { comparePassword, createToken, hashPassword } from "../utils/jwtHelper.js";
import { ConflictError, ValidationError } from "../utils/errors.js";
import { sendWelcomeEmail } from "../services/email/notificationService.js";
import { randomBytes, createHash } from "node:crypto";
import { sendPasswordResetEmail } from "../services/email/notificationService.js"; 

// Return user information
function getUserInfo(user) {
  return {
    name: user.name,
    id: user._id,
    email: user.email,
    role: user.role,
  };
}

// POST /api/auth/register
export async function register(req, res, next) {
   console.log("call register");
  try {
    const { name, email, password } = req.body || {};

    // Check fields
    if (!name || !email || !password) {
      return next(new ValidationError("Name, email and password are required."));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(new ConflictError("Email already registered."));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "learner",
    });
    console.log("user created");
    try {
      await sendWelcomeEmail(newUser);
       console.log("welcome email service completed");
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }
    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: getUserInfo(newUser),
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return next(new ValidationError("Email and password are required."));
    }
    // Find user
    const user = await User.findOne({ email }).select('password');

    console.log(user)

    if (!user) {
      return next(new ValidationError("Invalid credentials."));
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password)

    if (!isMatch) {
      return next(new ValidationError("Invalid credentials."));
    }

    // Create token
    const token = createToken(user);

    // Send response
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: token,
      data: {
        user: getUserInfo(user),
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {}

    if (!email) {
      return next(new ValidationError("Email is required."))
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    const message =
      "If an account exists with this email, a reset link will be sent."

    if (!user) {
      return res.status(200).json({ success: true, message });
    }

    const resetToken = randomBytes(32).toString("hex")

    user.resetPasswordToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl =
      `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendPasswordResetEmail(user, resetUrl ,resetToken)
    } catch (emailError) {
      user.resetPasswordToken = null
      user.resetPasswordExpires = null
      await user.save();

      throw emailError;
    }

    return res.status(200).json({ success: true, message })
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, token, password } = req.body || {};

    if (!email || !token || !password) {
      return next(
        new ValidationError("Email, token and new password are required.")
      );
    }

    if (password.length < 8) {
      return next(
        new ValidationError("Password must contain at least 8 characters.")
      );
    }

    const hashedToken = createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, //gt operateur comparaison mongoose greater than
    });

    if (!user) {
      return next(
        new ValidationError("Invalid or expired password reset token.")
      );
    }

    user.password = await hashPassword(password);

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
}




