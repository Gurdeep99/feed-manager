import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  await connectDB();
  const { name, email, password } = await req.json();

  const existing = await User.findOne({ email });
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  return Response.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}
