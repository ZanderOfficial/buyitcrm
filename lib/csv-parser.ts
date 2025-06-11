/**
 * Enhanced CSV Parser
 * Handles complex cases including:
 * - Quoted fields (fields containing commas, newlines, or quotes)
 * - Different delimiters (comma, semicolon, tab)
 * - Escaped quotes within quoted fields
 * - Empty fields
 */

export interface CSVParserOptions {
  delimiter?: string
  hasHeader?: boolean
  trimValues?: boolean
}

export interface CSVParseResult {
  headers: string[]
  data: Record<string, string>[]
  errors?: string[]
}

export function parseCSV(csvString: string, options: CSVParserOptions = {}): CSVParseResult {
  // Default options
  const delimiter = options.delimiter || ","
  const hasHeader = options.hasHeader !== false // Default to true
  const trimValues = options.trimValues !== false // Default to true

  // Prepare result
  const result: CSVParseResult = {
    headers: [],
    data: [],
    errors: [],
  }

  // Handle empty input
  if (!csvString || csvString.trim() === "") {
    result.errors?.push("Empty CSV content")
    return result
  }

  try {
    // Split into lines, preserving newlines in quoted fields
    const lines: string[] = []
    let currentLine = ""
    let inQuotes = false

    for (let i = 0; i < csvString.length; i++) {
      const char = csvString[i]
      const nextChar = i < csvString.length - 1 ? csvString[i + 1] : ""

      // Handle quotes
      if (char === '"') {
        // Check for escaped quotes (double quotes)
        if (nextChar === '"') {
          currentLine += '"'
          i++ // Skip the next quote
        } else {
          inQuotes = !inQuotes
        }
        continue
      }

      // Handle line breaks
      if (char === "\n" && !inQuotes) {
        if (currentLine.trim() !== "") {
          lines.push(currentLine)
        }
        currentLine = ""
        continue
      }

      // Handle carriage returns (often paired with newlines)
      if (char === "\r") {
        continue
      }

      // Add character to current line
      currentLine += char
    }

    // Add the last line if not empty
    if (currentLine.trim() !== "") {
      lines.push(currentLine)
    }

    // Check if we have any lines
    if (lines.length === 0) {
      result.errors?.push("No valid data lines found")
      return result
    }

    // Parse headers
    if (hasHeader && lines.length > 0) {
      result.headers = parseCSVLine(lines[0], delimiter, trimValues)
      lines.shift() // Remove header line
    }

    // Parse data rows
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const values = parseCSVLine(line, delimiter, trimValues)

      // Skip empty lines
      if (values.length === 0 || (values.length === 1 && values[0] === "")) {
        continue
      }

      // If no headers defined but we have data, use indices as headers
      if (result.headers.length === 0) {
        result.headers = Array.from({ length: values.length }, (_, i) => `field${i + 1}`)
      }

      // Create row object
      const row: Record<string, string> = {}
      for (let j = 0; j < result.headers.length; j++) {
        row[result.headers[j]] = j < values.length ? values[j] : ""
      }

      result.data.push(row)
    }

    // Check if we have any data
    if (result.data.length === 0) {
      result.errors?.push("No data rows found after parsing")
    }

    return result
  } catch (error) {
    result.errors?.push(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`)
    return result
  }
}

/**
 * Parse a single CSV line into an array of values
 */
function parseCSVLine(line: string, delimiter: string, trim: boolean): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = i < line.length - 1 ? line[i + 1] : ""

    // Handle quotes
    if (char === '"') {
      // Check for escaped quotes (double quotes)
      if (nextChar === '"') {
        currentValue += '"'
        i++ // Skip the next quote
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    // Handle delimiters
    if (char === delimiter && !inQuotes) {
      values.push(trim ? currentValue.trim() : currentValue)
      currentValue = ""
      continue
    }

    // Add character to current value
    currentValue += char
  }

  // Add the last value
  values.push(trim ? currentValue.trim() : currentValue)

  return values
}

/**
 * Auto-detect the delimiter used in a CSV string
 * Returns the most likely delimiter (comma, semicolon, or tab)
 */
export function detectDelimiter(csvSample: string): string {
  // Count occurrences of common delimiters
  const counts = {
    ",": 0,
    ";": 0,
    "\t": 0,
  }

  // Only check the first few lines to save processing time
  const sampleLines = csvSample.split("\n").slice(0, 5).join("\n")

  let inQuotes = false
  for (let i = 0; i < sampleLines.length; i++) {
    const char = sampleLines[i]

    // Skip content inside quotes
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (!inQuotes) {
      if (char === ",") counts[","]++
      if (char === ";") counts[";"]++
      if (char === "\t") counts["\t"]++
    }
  }

  // Return the delimiter with the highest count
  if (counts[","] >= counts[";"] && counts[","] >= counts["\t"]) return ","
  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"]) return ";"
  return "\t"
}

/**
 * Validate CSV data against expected columns
 */
export function validateCSVData(
  parseResult: CSVParseResult,
  expectedColumns: string[],
  requiredColumns: string[] = [],
): { valid: boolean; missingColumns: string[]; errors: string[] } {
  const result = {
    valid: true,
    missingColumns: [] as string[],
    errors: [] as string[],
  }

  // Check for missing expected columns
  const missingColumns = expectedColumns.filter((col) => !parseResult.headers.includes(col))
  if (missingColumns.length > 0) {
    result.missingColumns = missingColumns

    // Only mark as invalid if required columns are missing
    const missingRequired = requiredColumns.filter((col) => missingColumns.includes(col))
    if (missingRequired.length > 0) {
      result.valid = false
      result.errors.push(`Missing required columns: ${missingRequired.join(", ")}`)
    }
  }

  return result
}
