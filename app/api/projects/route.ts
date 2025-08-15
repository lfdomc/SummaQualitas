import { NextResponse } from "next/server"
import { projects } from "@/lib/projects-data"

export async function GET() {
  try {
    // Simular un pequeño delay para mostrar el loading state
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
