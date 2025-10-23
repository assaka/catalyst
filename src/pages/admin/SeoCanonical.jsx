import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Link2, HelpCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function SeoCanonical() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 500));

    setSaveSuccess(true);
    setSaving(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Link2 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Canonical URLs</h1>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Canonical URLs tell search engines which version of a page is the "master" copy, preventing duplicate content penalties and consolidating SEO value.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Canonical Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 border-l-2 border-blue-200 pl-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="auto-canonical" defaultChecked />
                <Label htmlFor="auto-canonical" className="font-medium">Auto-generate canonical URLs</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-12">
                Automatically add canonical tags to all pages. Recommended for most sites to prevent duplicate content issues.
              </p>
            </div>
          </div>

          <div className="space-y-4 border-l-2 border-green-200 pl-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="https-canonical" defaultChecked />
                <Label htmlFor="https-canonical" className="font-medium">Force HTTPS in canonical URLs</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-12">
                Always use HTTPS protocol in canonical URLs for better security and SEO. Enable if your site has an SSL certificate.
              </p>
            </div>
          </div>

          <div className="space-y-4 border-l-2 border-purple-200 pl-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="www-canonical" />
                <Label htmlFor="www-canonical" className="font-medium">Include www in canonical URLs</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-12">
                Add "www" subdomain to canonical URLs (e.g., www.example.com vs example.com). Choose one format and use it consistently.
              </p>
            </div>
          </div>

          <div className="space-y-4 border-l-2 border-orange-200 pl-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="trailing-slash" />
                <Label htmlFor="trailing-slash" className="font-medium">Add trailing slash to canonical URLs</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-12">
                End URLs with a forward slash (e.g., /products/ instead of /products). Important for consistency with your URL structure.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="canonical-domain" className="font-medium">Canonical Domain Override</Label>
            <Input id="canonical-domain" placeholder="https://example.com" />
            <p className="text-sm text-muted-foreground">
              Specify a different domain for all canonical URLs. Useful when your site is accessible via multiple domains (e.g., .com, .net) but you want to consolidate SEO signals to one primary domain.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end my-8">
        <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Save Settings"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Canonical URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Override the auto-generated canonical URL for specific pages. This is useful when you want to consolidate similar pages or point duplicate content to a preferred version.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="page-url" className="font-medium">Page URL (Source)</Label>
            <Input id="page-url" placeholder="/products/example-product" />
            <p className="text-sm text-muted-foreground">
              Enter the relative path of the page that needs a custom canonical URL (e.g., /products/variant-1)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonical-url" className="font-medium">Canonical URL (Target)</Label>
            <Input id="canonical-url" placeholder="https://example.com/products/main-product" />
            <p className="text-sm text-muted-foreground">
              Enter the full canonical URL that the page should point to. Use absolute URLs with the full domain.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Example Use Case:</p>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Scenario:</strong> You have similar product pages that should consolidate to one main page</p>
              <p><strong>Page URL:</strong> <code className="bg-white px-1 py-0.5 rounded">/products/wireless-headphones-red</code></p>
              <p><strong>Canonical URL:</strong> <code className="bg-white px-1 py-0.5 rounded">https://example.com/products/wireless-headphones</code></p>
              <p className="mt-2 italic">Result: The red variant page will indicate that the main product page is the preferred version for search engines.</p>
            </div>
          </div>

        </CardContent>
      </Card>
      <div className="flex justify-end mt-8">
        <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Add Custom Canonical"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-are-canonical">
              <AccordionTrigger>What are Canonical URLs?</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>
                  A canonical URL is an HTML element that tells search engines which URL is the main or preferred version of a page when multiple URLs contain similar or duplicate content.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For example, these URLs might show the same product:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>https://example.com/products/shoes</li>
                  <li>https://example.com/products/shoes?color=blue</li>
                  <li>https://example.com/products/shoes?sort=price</li>
                  <li>http://www.example.com/products/shoes</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  The canonical tag tells search engines that <code className="bg-gray-100 px-1 py-0.5 rounded">https://example.com/products/shoes</code> is the preferred version.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="why-important">
              <AccordionTrigger>Why are they important for SEO?</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>Canonical URLs are critical for SEO because they:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Prevent duplicate content penalties</strong> - Search engines may penalize sites with duplicate content
                  </li>
                  <li>
                    <strong>Consolidate link equity</strong> - All backlinks and page authority signals are attributed to the canonical URL
                  </li>
                  <li>
                    <strong>Improve crawl efficiency</strong> - Search engines can focus on crawling unique content instead of duplicates
                  </li>
                  <li>
                    <strong>Simplify analytics</strong> - Track performance metrics for a single URL instead of multiple variations
                  </li>
                  <li>
                    <strong>Control which URL appears in search results</strong> - Ensure your preferred URL is shown to users
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-to-use">
              <AccordionTrigger>How to use these settings</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <strong className="text-sm">Auto-generate canonical URLs</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    When enabled, the system automatically adds canonical tags to all pages. Recommended for most sites.
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Force HTTPS in canonical URLs</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Always use HTTPS in canonical URLs, even if the page is accessed via HTTP. Highly recommended for sites with SSL certificates.
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Include www in canonical URLs</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose whether to include "www" in your canonical URLs. Pick one version (with or without www) and stick with it consistently.
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Add trailing slash to canonical URLs</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Determines if URLs should end with a "/" (e.g., /products/ vs /products). Choose based on your URL structure preference.
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Canonical Domain</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Override the default domain for all canonical URLs. Useful if your site is accessible via multiple domains but you want to specify one as the canonical domain.
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Custom Canonical URLs</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manually specify canonical URLs for specific pages. Use this when the auto-generated canonical doesn't match your needs, such as when consolidating similar content pages.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="best-practices">
              <AccordionTrigger>Best Practices</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Be consistent</strong> - Use the same URL format (HTTPS vs HTTP, www vs non-www, trailing slash) across your entire site
                  </li>
                  <li>
                    <strong>Use absolute URLs</strong> - Always use full URLs including the domain (e.g., https://example.com/page) rather than relative paths
                  </li>
                  <li>
                    <strong>Self-referencing is okay</strong> - It's fine for a canonical tag to point to itself. This tells search engines "this is the original content"
                  </li>
                  <li>
                    <strong>One canonical per page</strong> - Each page should only have one canonical tag
                  </li>
                  <li>
                    <strong>Canonical should be indexable</strong> - The canonical URL should be accessible (200 status), not blocked by robots.txt, and not require authentication
                  </li>
                  <li>
                    <strong>Use for near-duplicates</strong> - Canonical tags work best for pages with similar content, not completely different pages
                  </li>
                  <li>
                    <strong>Check for chain issues</strong> - Avoid canonical tag chains (Page A → Page B → Page C). Point directly to the final canonical
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="common-use-cases">
              <AccordionTrigger>Common Use Cases</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div>
                  <strong className="text-sm">1. URL Parameters for Filtering/Sorting</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Product listings with filters (color, size, price) should canonicalize to the base category page.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                    Example: <code className="bg-gray-100 px-1 py-0.5 rounded">/products?color=blue</code> → <code className="bg-gray-100 px-1 py-0.5 rounded">/products</code>
                  </p>
                </div>
                <div className="mt-3">
                  <strong className="text-sm">2. Paginated Content</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Decide if paginated pages should point to the first page or self-canonicalize.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                    Example: <code className="bg-gray-100 px-1 py-0.5 rounded">/blog?page=2</code> → <code className="bg-gray-100 px-1 py-0.5 rounded">/blog</code> OR self-reference
                  </p>
                </div>
                <div className="mt-3">
                  <strong className="text-sm">3. Session IDs and Tracking Parameters</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    URLs with session IDs or tracking codes should canonicalize to the clean URL.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                    Example: <code className="bg-gray-100 px-1 py-0.5 rounded">/page?sessionid=123&utm_source=email</code> → <code className="bg-gray-100 px-1 py-0.5 rounded">/page</code>
                  </p>
                </div>
                <div className="mt-3">
                  <strong className="text-sm">4. HTTP vs HTTPS</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    If your site supports both HTTP and HTTPS, always canonicalize to HTTPS.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                    Example: <code className="bg-gray-100 px-1 py-0.5 rounded">http://example.com/page</code> → <code className="bg-gray-100 px-1 py-0.5 rounded">https://example.com/page</code>
                  </p>
                </div>
                <div className="mt-3">
                  <strong className="text-sm">5. Multiple Domains</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    If content is accessible via multiple domains, choose one as the canonical domain.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                    Example: Content on both example.com and example.net → canonicalize all to example.com
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="technical-notes">
              <AccordionTrigger>Technical Notes</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm">
                  The canonical tag is implemented in the HTML <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;head&gt;</code> section:
                </p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mt-2">
{`<link rel="canonical" href="https://example.com/preferred-url" />`}
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Note:</strong> Canonical tags are hints to search engines, not directives. Search engines may choose to ignore them if they detect issues or inconsistencies.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Testing:</strong> Use Google Search Console's URL Inspection tool to verify your canonical tags are being recognized correctly.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}