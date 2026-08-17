import { LayoutDashboard } from "lucide-react";
import PagePlaceholder from "../components/PagePlaceholder.jsx";

export default function Dashboard() {
  return (
    <PagePlaceholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Today's sales, purchases, low-stock alerts, and recent activity will appear here."
    />
  );
}
