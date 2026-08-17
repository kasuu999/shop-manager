import { Settings } from "lucide-react";
import PagePlaceholder from "../components/PagePlaceholder.jsx";

export default function ShopSettings() {
  return (
    <PagePlaceholder
      icon={Settings}
      title="Shop Settings"
      description="Update your shop name, contact info, and GST details here."
    />
  );
}
