import { Boxes } from "lucide-react";
import PagePlaceholder from "../components/PagePlaceholder.jsx";

export default function Stock() {
  return (
    <PagePlaceholder
      icon={Boxes}
      title="Stock"
      description="See stock levels and history for every product here."
    />
  );
}
