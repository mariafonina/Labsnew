import { useParams, useLocation } from "react-router-dom";
import { AdminProducts } from "../../components/AdminProducts";

export function AdminProductsPage() {
  const params = useParams<{
    productId?: string;
    cohortId?: string;
    section?: string;
    itemId?: string;
    "*"?: string;
  }>();
  const location = useLocation();

  const { productId, cohortId, section, itemId } = params;

  // Determine action from URL pattern
  const urlPath = location.pathname;
  let action: string | undefined;

  if (urlPath.endsWith("/new-category")) {
    action = "new-category";
  } else if (urlPath.includes("/category/") && urlPath.endsWith("/new")) {
    action = "new"; // New instruction in category
  } else if (urlPath.includes("/instruction/") && urlPath.endsWith("/edit")) {
    action = "edit"; // Edit instruction
  } else if (urlPath.endsWith("/new")) {
    action = "new"; // Generic new
  } else if (urlPath.endsWith("/edit")) {
    action = "edit"; // Generic edit
  }

  return (
    <AdminProducts
      selectedProductId={productId}
      selectedCohortId={cohortId}
      section={section}
      action={action}
      itemId={itemId}
    />
  );
}
