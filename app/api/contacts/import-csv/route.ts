import { NextResponse } from "next/server"
import { parse } from "csv-parse"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient()
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const fileContent = Buffer.from(fileBuffer).toString()

    const records: any[] = []
    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    parser.on("readable", () => {
      let record
      while ((record = parser.read())) {
        records.push(record)
      }
    })

    await new Promise((resolve, reject) => {
      parser.on("end", resolve)
      parser.on("error", reject)
    })

    const { data, error } = await supabase.from("contacts").insert(records).select()

    if (error) {
      console.error("Error inserting data:", error)
      return NextResponse.json({ error: "Failed to insert data" }, { status: 500 })
    }

    return NextResponse.json({ message: "CSV imported successfully", data }, { status: 200 })
  } catch (error) {
    console.error("Error processing CSV:", error)
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 })
  }
}
