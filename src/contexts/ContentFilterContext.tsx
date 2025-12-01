import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiClient } from "../api/client";

export interface UserEnrollment {
  enrollment_id: number;
  status: string;
  enrolled_at: string;
  expires_at: string | null;
  product_id: number;
  product_name: string;
  product_description: string;
  product_type: string;
  product_color: string | null;
  cohort_id: number | null;
  cohort_name: string | null;
  cohort_start_date: string | null;
  cohort_end_date: string | null;
  tier_id: number | null;
  tier_name: string | null;
  tier_level: number | null;
}

export interface ProductWithCohorts {
  id: number;
  name: string;
  color: string;
  cohorts: {
    id: number;
    name: string;
  }[];
}

interface ContentFilterContextType {
  enrollments: UserEnrollment[];
  products: ProductWithCohorts[];
  selectedProductIds: number[];
  selectedCohortIds: number[];
  isLoading: boolean;
  toggleProduct: (productId: number) => void;
  toggleCohort: (cohortId: number) => void;
  selectAllProducts: () => void;
  deselectAllProducts: () => void;
  isProductSelected: (productId: number) => boolean;
  isCohortSelected: (cohortId: number) => boolean;
  refreshEnrollments: () => Promise<void>;
  getProductColor: (productId: number) => string;
}

const DEFAULT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

const ContentFilterContext = createContext<ContentFilterContextType | undefined>(undefined);

const STORAGE_KEY = "labs_content_filters";

export function ContentFilterProvider({ children }: { children: ReactNode }) {
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedCohortIds, setSelectedCohortIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const products: ProductWithCohorts[] = enrollments
    .filter((e) => e.status === "active")
    .reduce((acc, enrollment) => {
      const existingProduct = acc.find((p) => p.id === enrollment.product_id);
      if (existingProduct) {
        if (enrollment.cohort_id && !existingProduct.cohorts.find((c) => c.id === enrollment.cohort_id)) {
          existingProduct.cohorts.push({
            id: enrollment.cohort_id,
            name: enrollment.cohort_name || `Поток ${enrollment.cohort_id}`,
          });
        }
      } else {
        acc.push({
          id: enrollment.product_id,
          name: enrollment.product_name,
          color: enrollment.product_color || DEFAULT_COLORS[enrollment.product_id % DEFAULT_COLORS.length],
          cohorts: enrollment.cohort_id
            ? [{ id: enrollment.cohort_id, name: enrollment.cohort_name || `Поток ${enrollment.cohort_id}` }]
            : [],
        });
      }
      return acc;
    }, [] as ProductWithCohorts[]);

  const loadFiltersFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          productIds: parsed.productIds || [],
          cohortIds: parsed.cohortIds || [],
        };
      }
    } catch (e) {
      console.error("Failed to load filters from storage:", e);
    }
    return null;
  }, []);

  const saveFiltersToStorage = useCallback((productIds: number[], cohortIds: number[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ productIds, cohortIds }));
    } catch (e) {
      console.error("Failed to save filters to storage:", e);
    }
  }, []);

  const refreshEnrollments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getUserEnrollments();
      setEnrollments(data);
      
      const activeEnrollments = data.filter((e: UserEnrollment) => e.status === "active");
      const allProductIds = [...new Set(activeEnrollments.map((e: UserEnrollment) => e.product_id))];
      const allCohortIds = [...new Set(activeEnrollments.filter((e: UserEnrollment) => e.cohort_id).map((e: UserEnrollment) => e.cohort_id!))] as number[];

      const savedFilters = loadFiltersFromStorage();
      if (savedFilters && savedFilters.productIds.length > 0) {
        const validProductIds = savedFilters.productIds.filter((id: number) => allProductIds.includes(id));
        const validCohortIds = savedFilters.cohortIds.filter((id: number) => allCohortIds.includes(id));
        setSelectedProductIds(validProductIds.length > 0 ? validProductIds : allProductIds);
        setSelectedCohortIds(validCohortIds.length > 0 ? validCohortIds : allCohortIds);
      } else {
        setSelectedProductIds(allProductIds);
        setSelectedCohortIds(allCohortIds);
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFiltersFromStorage]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      refreshEnrollments();
    }
  }, [refreshEnrollments]);

  useEffect(() => {
    if (selectedProductIds.length > 0 || selectedCohortIds.length > 0) {
      saveFiltersToStorage(selectedProductIds, selectedCohortIds);
    }
  }, [selectedProductIds, selectedCohortIds, saveFiltersToStorage]);

  const toggleProduct = useCallback((productId: number) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
    
    const productCohorts = enrollments
      .filter((e) => e.product_id === productId && e.cohort_id)
      .map((e) => e.cohort_id!);
    
    setSelectedCohortIds((prev) => {
      const isCurrentlySelected = selectedProductIds.includes(productId);
      if (isCurrentlySelected) {
        return prev.filter((id) => !productCohorts.includes(id));
      }
      return [...new Set([...prev, ...productCohorts])];
    });
  }, [enrollments, selectedProductIds]);

  const toggleCohort = useCallback((cohortId: number) => {
    setSelectedCohortIds((prev) => {
      if (prev.includes(cohortId)) {
        return prev.filter((id) => id !== cohortId);
      }
      return [...prev, cohortId];
    });
  }, []);

  const selectAllProducts = useCallback(() => {
    const allProductIds = products.map((p) => p.id);
    const allCohortIds = products.flatMap((p) => p.cohorts.map((c) => c.id));
    setSelectedProductIds(allProductIds);
    setSelectedCohortIds(allCohortIds);
  }, [products]);

  const deselectAllProducts = useCallback(() => {
    setSelectedProductIds([]);
    setSelectedCohortIds([]);
  }, []);

  const isProductSelected = useCallback(
    (productId: number) => selectedProductIds.includes(productId),
    [selectedProductIds]
  );

  const isCohortSelected = useCallback(
    (cohortId: number) => selectedCohortIds.includes(cohortId),
    [selectedCohortIds]
  );

  const getProductColor = useCallback(
    (productId: number) => {
      const product = products.find((p) => p.id === productId);
      return product?.color || DEFAULT_COLORS[productId % DEFAULT_COLORS.length];
    },
    [products]
  );

  return (
    <ContentFilterContext.Provider
      value={{
        enrollments,
        products,
        selectedProductIds,
        selectedCohortIds,
        isLoading,
        toggleProduct,
        toggleCohort,
        selectAllProducts,
        deselectAllProducts,
        isProductSelected,
        isCohortSelected,
        refreshEnrollments,
        getProductColor,
      }}
    >
      {children}
    </ContentFilterContext.Provider>
  );
}

export function useContentFilter() {
  const context = useContext(ContentFilterContext);
  if (context === undefined) {
    throw new Error("useContentFilter must be used within a ContentFilterProvider");
  }
  return context;
}
