# Document Management API Documentation

This project includes comprehensive API documentation using the OpenAPI Specification (OAS) 3.1.0. The documentation describes all available endpoints, request/response formats, and error handling.

## Viewing the API Documentation

There are several ways to view and interact with the API documentation:

### Option 1: Using Swagger UI

1. Install the Swagger UI package:

   ```bash
   pnpm add swagger-ui-express
   ```

2. Add the following code to your Next.js API route (create a new file at `app/api/docs/route.ts`):

   ```typescript
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
   ```

3. Install a Swagger UI viewer extension in your browser and point it to `/api/docs`.

### Option 2: Using Swagger Editor Online

1. Visit [Swagger Editor](https://editor.swagger.io/)
2. Copy the contents of `openapi.yaml` and paste it into the editor
3. The right panel will display a rendered version of your API documentation

### Option 3: Using Redoc

1. Install Redoc:

   ```bash
   pnpm add redoc-express
   ```

2. Create a simple HTML page to serve the documentation (e.g., `public/api-docs.html`):

   ```html
   <!DOCTYPE html>
   <html>
     <head>
       <title>Document Management API Documentation</title>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <link
         href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700"
         rel="stylesheet"
       />
       <style>
         body {
           margin: 0;
           padding: 0;
         }
       </style>
     </head>
     <body>
       <redoc spec-url="/api/docs"></redoc>
       <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
     </body>
   </html>
   ```

3. Access the documentation at `/api-docs.html`

## API Documentation Structure

The OpenAPI specification (`openapi.yaml`) includes:

1. **Schemas**: Defines the data models used in the API (Document, Extraction, Error, etc.)
2. **Paths**: Documents all API endpoints and their operations
3. **Parameters**: Describes path, query, and body parameters
4. **Responses**: Details the structure of API responses, including error responses
5. **Components**: Reusable components like parameters and response schemas

## Error Handling

The API uses a consistent error format across all endpoints:

```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details specific to the error type
    }
  }
}
```

Error types include:

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Requested resource not found
- `INTERNAL_SERVER_ERROR`: Server-side error
- `BAD_REQUEST`: Malformed request
- `SERVICE_UNAVAILABLE`: External service (like S3) unavailable

## Backward Compatibility

The API documentation notes where endpoints support both legacy and enhanced response formats to maintain backward compatibility with existing clients.

## Updating the Documentation

When making changes to the API, be sure to update the `openapi.yaml` file to keep the documentation in sync with the implementation.
