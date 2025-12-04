import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Homepage from "./Homepage";
import Category from "./Category";
import Landing from "./Landing";

/**
 * Storefront - Router component that determines whether to show Homepage or Category
 * based on the presence of a category slug in the URL
 *
 * On platform domains (dainostore.com, daino.ai, daino.store) shows Landing page
 * On custom store domains shows Homepage/Category
 */
export default function Storefront() {
  const { categorySlug: routeCategorySlug } = useParams();
  const [searchParams] = useSearchParams();

  const categorySlug = searchParams.get('category') || routeCategorySlug;

  // Check if we're on a platform domain (not a custom store domain)
  const hostname = window.location.hostname;
  const isPlatformDomain = hostname.includes('dainostore.com') ||
                           hostname.includes('daino.ai') ||
                           hostname.includes('daino.store');

  // On platform domains, show the Landing page (unless there's a category)
  if (isPlatformDomain && !categorySlug) {
    return <Landing />;
  }

  // If there's a category slug, show the Category component
  // Otherwise, show the Homepage component
  return categorySlug ? <Category /> : <Homepage />;
}