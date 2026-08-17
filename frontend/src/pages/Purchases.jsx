import { ShoppingCart } from "lucide-react";
import PagePlaceholder from "../components/PagePlaceholder.jsx";

export default function Purchases() {
  return (
    <PagePlaceholder
      icon={ShoppingCart}
      title="Purchases"
      description="Record stock purchases from your suppliers here."
    />
  );
}
