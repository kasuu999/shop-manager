import { Users } from "lucide-react";
import PagePlaceholder from "../components/PagePlaceholder.jsx";

export default function Customers() {
  return (
    <PagePlaceholder
      icon={Users}
      title="Customers"
      description="View and manage your customer list here."
    />
  );
}
