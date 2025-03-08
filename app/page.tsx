import { DocumentDashboard } from "@/components/document-dashboard";

export default async function Home() {
  // Simulate a 2-second delay for demonstration purposes
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return <DocumentDashboard />;
}
