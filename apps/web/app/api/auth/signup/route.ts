import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        hashedPassword,
        onboardingComplete: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Track signup event
    await prisma.event.create({
      data: {
        userId: user.id,
        name: "signup_completed",
        properties: {
          method: "credentials",
        },
      },
    });

    // Send welcome email (async, don't wait)
    triggerWelcomeEmail(user.id).catch((err) => {
      console.error("Failed to trigger welcome email:", err);
    });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
