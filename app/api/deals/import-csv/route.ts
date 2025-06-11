import { type NextRequest, NextResponse } from "next/server"
import { parse } from "csv-parse"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const fileContent = Buffer.from(fileBuffer).toString("utf-8")

    const supabase = getSupabaseServerClient()

    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const records = []
    for await (const record of parser) {
      records.push(record)
    }

    const { data, error } = await supabase.from("deals").insert(records)

    if (error) {
      console.error("Error inserting data:", error)
      return NextResponse.json({ error: "Failed to import data" }, { status: 500 })
    }

    return NextResponse.json({ message: "Data imported successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error processing CSV:", error)
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 })
  }
}
