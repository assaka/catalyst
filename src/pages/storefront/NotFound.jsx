import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CmsPage } from '@/api/entities';
import { useStore } from '@/components/storefront/StoreProvider';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import { getPageTitle, getPageContent, getCurrentLanguage } from '@/utils/translationUtils';
import { createPublicUrl } from '@/utils/urlUtils';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { storeCode } = useParams();
  const { store } = useStore();
  const [cmsPage, setCmsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentLang = getCurrentLanguage();

  useEffect(() => {
    const fetchNotFoundPage = async () => {
      try {
        setLoading(true);
        // Try to fetch a CMS page with slug '404' or 'not-found'
        let pages = await CmsPage.filter({ slug: '404', is_active: true });

        if (!pages || pages.length === 0) {
          pages = await CmsPage.filter({ slug: 'not-found', is_active: true });
        }

        if (!pages || pages.length === 0) {
          pages = await CmsPage.filter({ slug: 'page-not-found', is_active: true });
        }

        if (pages && pages.length > 0) {
          setCmsPage(pages[0]);
        }
      } catch (error) {
        console.error("Error fetching 404 CMS page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotFoundPage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const effectiveStoreCode = storeCode || store?.slug || store?.code;
  const homeUrl = effectiveStoreCode ? createPublicUrl(effectiveStoreCode, 'STOREFRONT') : '/';

  // If CMS page exists, use it
  if (cmsPage) {
    const pageTitle = getPageTitle(cmsPage, currentLang);
    const pageContent = getPageContent(cmsPage, currentLang);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SeoHeadManager
          pageType="404"
          pageData={cmsPage}
          pageTitle={pageTitle || "Page Not Found"}
        />
        <article className="prose lg:prose-xl mx-auto bg-white p-8 rounded-lg shadow">
          <h1>{pageTitle || "404 - Page Not Found"}</h1>
          <div dangerouslySetInnerHTML={{ __html: pageContent }} />

          <div className="flex gap-4 mt-8 not-prose">
            <Link to={homeUrl}>
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </article>
      </div>
    );
  }

  // Default 404 page if no CMS page is configured
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SeoHeadManager
        pageType="404"
        pageTitle="404 - Page Not Found"
      />
      <div className="text-center bg-white p-12 rounded-lg shadow">
        <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex gap-4 justify-center">
          <Link to={homeUrl}>
            <Button size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
