import User from "../models/User.js";
import { comparePassword, createToken, hashPassword } from "../utils/jwtHelper.js";
import { ConflictError, ValidationError } from "../utils/errors.js";
import { sendWelcomeEmail } from "../services/email/notificationService.js";

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
