import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import YAML from "yaml";

export async function GET() {
  try {
    // Read the OpenAPI specification file
    const filePath = path.join(process.cwd(), "openapi.yaml");
    const fileContents = fs.readFileSync(filePath, "utf8");

    // Parse YAML to JSON
    const openApiSpec = YAML.parse(fileContents);

    return NextResponse.json(openApiSpec);
  } catch (error) {
    console.error("Error serving OpenAPI spec:", error);
    return NextResponse.json(
      { error: "Failed to serve OpenAPI specification" },
      { status: 500 }
    );
  }
}
