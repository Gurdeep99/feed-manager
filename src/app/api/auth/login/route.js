import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "Invalid" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return Response.json({ error: "Invalid" }, { status: 401 });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  return Response.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}
