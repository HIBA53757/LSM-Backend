import User from "../models/User.js";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";

// Check if email and password exist
function checkFields(email, password) {
  if (!email || !password) {
    return false;
  }

  return true;
}

// Hash the password
async function hashPassword(password) {
  const hashedPassword = await hash(password, 10);

  return hashedPassword;
}

// Create JWT token
function createToken(user) {
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return token;
}

// Return user information
function getUserInfo(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
  };
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!checkFields(email, password)) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered.",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "learner",
    });

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      user: getUserInfo(newUser),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!checkFields(email, password)) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    // Compare passwords
    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    // Create token
    const token = createToken(user);

    // Send response
    res.status(200).json({
      message: "Logged in successfully",
      token: token,
      user: getUserInfo(user),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}
