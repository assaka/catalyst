import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Homepage from "./Homepage";
import Category from "./Category";

/**
 * Storefront - Router component that determines whether to show Homepage or Category
 * based on the presence of a category slug in the URL
 */
export default function Storefront() {
  const { categorySlug: routeCategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  
  const categorySlug = searchParams.get('category') || routeCategorySlug;
  
  // If there's a category slug, show the Category component
  // Otherwise, show the Homepage component
  return categorySlug ? <Category /> : <Homepage />;
}