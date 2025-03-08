# Project Overview

You're building a responsive Legal Document Management Interface using ReactJS that allows users to upload, view, and manage PDF documents. The application needs to have a responsive layout and provide modals for document upload and viewing, along with mock data extractions.

# Technical Stack

Nextjs 15 App Router with React 19, react-pdf, shadcn ui.

# UI/UX Design Components

The application has one single dashboard page along with document upload and document preview modals.

1. Document Dashboard

- A header with an icon in the top-left corner
- Nine document boxes arranged in a grid, labeled "Legal Document 1" through "Legal Document 9"
- Each box displays upload date and filename if a document has been uploaded
- Responsive layout using Flexbox

2. Upload Modal

- Appears when clicking on an empty document box
- Provides a file upload interface that accepts only PDF files
- Shows "Drag files here or click to select files" with a note that "only PDF files are allowed"
- Has "Cancel" and "Submit" buttons

3. Document Details Modal

- Appears when clicking on a document box that already has a file
- Split-screen layout:
  - Left panel: PDF preview with scrollable content
  - Right panel: List of mock extractions with page numbers and "Go To Page" buttons
- Header shows the document name and has a close (X) button

# Functional Specifications

### Document Dashboard

- Nine responsive document boxes
- Click behavior depends on whether a document is uploaded:
  - No document: Open Upload Modal
  - Document exists: Open Document Details Modal

### Upload Modal

- File input with validation (PDF only)
- Submit button to upload
- Error handling for invalid file types
- On successful upload:
  - Store filename and upload date
  - Display this info on the corresponding document box
  - Close the modal

### Document Details Modal

- Shows PDF preview on the left
- Right panel displays mock extractions with page numbers
- "Go To Page" buttons navigate to the specific page in the PDF
- Mock extractions should have random page numbers

# Backend

We are eliminating a backend since this is just an MVP concept project.

- Handle uploads in-browser:
  When a user uploads a PDF, you'll handle the file directly in the React application.

## Data Storage

- Use client-side storage (localStorage) for persisting document metadata across page reloads
- For an MVP, no database is required

## Mock extractions:

Generate mock extraction data directly in your frontend code:

# Additional Notes

- Responsive Design:

  - Utilize CSS Flexbox to ensure that the document boxes rearrange gracefully on
    different screen sizes.
  - Test the application on various devices to ensure usability.

- State Management:

  - Use React's useState and useEffect hooks for managing component states
    and side effects.
  - Consider using Context API or Zustand if the state becomes complex.

- PDF Handling:

  - Use libraries like react-pdf for rendering PDF previews within the application.
  - Ensure that the "Go To Page" functionality interacts correctly with the PDF viewer
    to navigate to the specified page.

- Error Handling & Validation:

  - Implement robust error handling for file uploads and API interactions.
  - Provide user-friendly error messages and feedback.

- Code Quality:
  - Maintain clean and readable code with proper commenting.
  - Follow best practices for React and NodeJS development.
