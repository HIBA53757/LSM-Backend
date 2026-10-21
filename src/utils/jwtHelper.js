import jwt from "jsonwebtoken";
import { hash, compare } from "bcryptjs";

// Hash the password
export async function hashPassword(password) {
  const hashedPassword = await hash(password, 10);

  return hashedPassword;
}

// Create JWT token
export function createToken(user) {
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

//compare Password
export async function comparePassword(password, passwordHash){
    return await compare(password, passwordHash);
}