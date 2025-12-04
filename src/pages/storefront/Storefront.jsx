import React from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import Homepage from "./Homepage";
import Category from "./Category";
import Landing from "./Landing";
import { shouldSkipStoreContext } from "@/utils/domainConfig";

/**
 * Storefront - Router component that determines whether to show Homepage or Category
 * based on the presence of a category slug in the URL
 *
 * Uses centralized shouldSkipStoreContext to determine if Landing should be shown
 */
export default function Storefront() {
  const { categorySlug: routeCategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const categorySlug = searchParams.get('category') || routeCategorySlug;

  // Use centralized config - show Landing if store context should be skipped
  if (shouldSkipStoreContext(location.pathname) && !categorySlug) {
    return <Landing />;
  }

  // If there's a category slug, show the Category component
  // Otherwise, show the Homepage component
  return categorySlug ? <Category /> : <Homepage />;
}