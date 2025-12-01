import { useContentFilter } from "../contexts/ContentFilterContext";
import { Checkbox } from "./ui/checkbox";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProductCohortFilterProps {
  compact?: boolean;
}

export function ProductCohortFilter({ compact = false }: ProductCohortFilterProps) {
  const {
    products,
    isLoading,
    isProductSelected,
    isCohortSelected,
    toggleProduct,
    toggleCohort,
  } = useContentFilter();
  
  const [expandedProducts, setExpandedProducts] = useState<number[]>([]);

  const toggleExpand = (productId: number) => {
    setExpandedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Загрузка...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  if (products.length === 1 && products[0].cohorts.length <= 1) {
    return null;
  }

  return (
    <div className={`space-y-1 ${compact ? "" : "py-2"}`}>
      {!compact && (
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Показывать
        </p>
      )}
      {products.map((product) => {
        const isExpanded = expandedProducts.includes(product.id);
        const productSelected = isProductSelected(product.id);
        const hasCohorts = product.cohorts.length > 0;
        const selectedCohortsCount = product.cohorts.filter((c) =>
          isCohortSelected(c.id)
        ).length;

        return (
          <div key={product.id} className="space-y-0.5">
            <div className="flex items-center gap-2">
              {hasCohorts && (
                <button
                  onClick={() => toggleExpand(product.id)}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
              )}
              {!hasCohorts && <div className="w-4" />}
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Checkbox
                  id={`product-${product.id}`}
                  checked={productSelected}
                  onCheckedChange={() => toggleProduct(product.id)}
                  className="data-[state=checked]:bg-current data-[state=checked]:border-current"
                  style={
                    productSelected
                      ? { backgroundColor: product.color, borderColor: product.color }
                      : undefined
                  }
                />
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: product.color }}
                />
                <label
                  htmlFor={`product-${product.id}`}
                  className="text-sm font-medium text-gray-700 cursor-pointer truncate"
                >
                  {product.name}
                </label>
                {hasCohorts && selectedCohortsCount < product.cohorts.length && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({selectedCohortsCount}/{product.cohorts.length})
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && hasCohorts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-8 pl-2 border-l border-gray-200 space-y-0.5">
                    {product.cohorts.map((cohort) => {
                      const cohortSelected = isCohortSelected(cohort.id);
                      return (
                        <div
                          key={cohort.id}
                          className="flex items-center gap-2 py-0.5"
                        >
                          <Checkbox
                            id={`cohort-${cohort.id}`}
                            checked={cohortSelected}
                            onCheckedChange={() => toggleCohort(cohort.id)}
                            className="h-3.5 w-3.5"
                          />
                          <label
                            htmlFor={`cohort-${cohort.id}`}
                            className="text-xs text-gray-600 cursor-pointer truncate"
                          >
                            {cohort.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
