import { Receipt } from "lucide-react";
import PagePlaceholder from "../components/PagePlaceholder.jsx";

export default function Sales() {
  return (
    <PagePlaceholder
      icon={Receipt}
      title="Sales"
      description="Create bills and view your sales history here."
    />
  );
}
