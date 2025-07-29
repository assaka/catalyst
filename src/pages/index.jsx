import Layout from "./Layout.jsx";

import Landing from "./Landing";

import Auth from "./Auth";

import CustomerAuth from "./CustomerAuth";

import Dashboard from "./Dashboard";

import Products from "./Products";

import Categories from "./Categories";

import Settings from "./Settings";

import Attributes from "./Attributes";

import Plugins from "./Plugins";

import Storefront from "./Storefront";

import ProductDetail from "./ProductDetail";

import Cart from "./Cart";

import CmsBlocks from "./CmsBlocks";

import Checkout from "./Checkout";

import Tax from "./Tax";

import Orders from "./Orders";

import CustomerDashboard from "./CustomerDashboard";

import Coupons from "./Coupons";

import CmsPages from "./CmsPages";

import CmsPageViewer from "./CmsPageViewer";

import ProductTabs from "./ProductTabs";

import ProductLabels from "./ProductLabels";

import CustomOptionRules from "./CustomOptionRules";

import OrderSuccess from "./OrderSuccess";

import ShippingMethods from "./ShippingMethods";

import GoogleTagManager from "./GoogleTagManager";

import DeliverySettings from "./DeliverySettings";

import ThemeLayout from "./ThemeLayout";

import MarketplaceExport from "./MarketplaceExport";

import ImageManager from "./ImageManager";

import HtmlSitemap from "./HtmlSitemap";

import Customers from "./Customers";

import StockSettings from "./StockSettings";

import AnalyticsSettings from "./AnalyticsSettings";

import PaymentMethods from "./PaymentMethods";

import SeoTools from "./SeoTools";

import XmlSitemap from "./XmlSitemap";

import RobotsTxt from "./RobotsTxt";

import Onboarding from "./Onboarding";

import Billing from "./Billing";

import ClientDashboard from "./ClientDashboard";

import Stores from "./Stores";

import OrderCancel from "./OrderCancel";

import CustomerActivity from "./CustomerActivity";

import CookieConsent from "./CookieConsent";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    Landing: Landing,
    
    Auth: Auth,
    
    CustomerAuth: CustomerAuth,
    
    Dashboard: Dashboard,
    
    Products: Products,
    
    Categories: Categories,
    
    Settings: Settings,
    
    Attributes: Attributes,
    
    Plugins: Plugins,
    
    Storefront: Storefront,
    
    ProductDetail: ProductDetail,
    
    Cart: Cart,
    
    CmsBlocks: CmsBlocks,
    
    Checkout: Checkout,
    
    Tax: Tax,
    
    Orders: Orders,
    
    CustomerDashboard: CustomerDashboard,
    
    Coupons: Coupons,
    
    CmsPages: CmsPages,
    
    CmsPageViewer: CmsPageViewer,
    
    ProductTabs: ProductTabs,
    
    ProductLabels: ProductLabels,
    
    CustomOptionRules: CustomOptionRules,
    
    OrderSuccess: OrderSuccess,
    
    ShippingMethods: ShippingMethods,
    
    GoogleTagManager: GoogleTagManager,
    
    DeliverySettings: DeliverySettings,
    
    ThemeLayout: ThemeLayout,
    
    MarketplaceExport: MarketplaceExport,
    
    ImageManager: ImageManager,
    
    HtmlSitemap: HtmlSitemap,
    
    Customers: Customers,
    
    StockSettings: StockSettings,
    
    AnalyticsSettings: AnalyticsSettings,
    
    PaymentMethods: PaymentMethods,
    
    SeoTools: SeoTools,
    
    XmlSitemap: XmlSitemap,
    
    RobotsTxt: RobotsTxt,
    
    Onboarding: Onboarding,
    
    Billing: Billing,
    
    ClientDashboard: ClientDashboard,
    
    Stores: Stores,
    
    OrderCancel: OrderCancel,
    
    CustomerActivity: CustomerActivity,
    
    CookieConsent: CookieConsent,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

import RoleProtectedRoute from '../components/RoleProtectedRoute.jsx';
import { StoreProvider } from '../components/storefront/StoreProvider.jsx';
import StorefrontLayout from '../components/storefront/StorefrontLayout.jsx';

// Helper function to determine if route needs StoreProvider
function isPublicRoute(pathname) {
    return pathname.startsWith('/public/');
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const needsStoreProvider = isPublicRoute(location.pathname);
    
    const content = needsStoreProvider ? (
        <StorefrontLayout>
            <Routes>            
                {/* Root redirect */}
                <Route path="/" element={<Landing />} />
                
                {/* =========================== */}
                {/* NEW URL STRUCTURE */}
                {/* =========================== */}
                
                {/* ADMIN ROUTES */}
                <Route path="/admin/login" element={
                    <RoleProtectedRoute requiresAuth={false}>
                        <Auth />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/dashboard" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Dashboard />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/products" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Products />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/categories" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Categories />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/orders" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Orders />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/customers" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Customers />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/settings" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Settings />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/analytics" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <AnalyticsSettings />
                    </RoleProtectedRoute>
                } />
                
                {/* PUBLIC STOREFRONT ROUTES */}
                <Route path="/public/:storeCode" element={<Storefront />} />
                <Route path="/public/:storeCode/" element={<Storefront />} />
                <Route path="/public/:storeCode/shop" element={<Storefront />} />
                <Route path="/public/:storeCode/shop/*" element={<Storefront />} />
                <Route path="/public/:storeCode/storefront" element={<Storefront />} />
                
                {/* SEO-friendly category routes */}
                <Route path="/public/:storeCode/category/:categorySlug" element={<Storefront />} />
                <Route path="/public/:storeCode/category/:categorySlug/*" element={<Storefront />} />
                <Route path="/public/:storeCode/c/:categorySlug" element={<Storefront />} />
                <Route path="/public/:storeCode/c/:categorySlug/*" element={<Storefront />} />
                
                {/* SEO-friendly product routes */}
                <Route path="/public/:storeCode/product/:productSlug" element={<ProductDetail />} />
                <Route path="/public/:storeCode/p/:productSlug" element={<ProductDetail />} />
                
                {/* Brand and collection pages */}
                <Route path="/public/:storeCode/brand/:brandSlug" element={<Storefront />} />
                <Route path="/public/:storeCode/brand/:brandSlug/*" element={<Storefront />} />
                <Route path="/public/:storeCode/collection/:collectionSlug" element={<Storefront />} />
                <Route path="/public/:storeCode/collection/:collectionSlug/*" element={<Storefront />} />
                
                {/* Search results */}
                <Route path="/public/:storeCode/search" element={<Storefront />} />
                <Route path="/public/:storeCode/search/*" element={<Storefront />} />
                
                {/* Shopping and checkout */}
                <Route path="/public/:storeCode/cart" element={<Cart />} />
                <Route path="/public/:storeCode/checkout" element={<Checkout />} />
                <Route path="/public/:storeCode/checkout/*" element={<Checkout />} />
                
                {/* Order completion */}
                <Route path="/public/:storeCode/order-success" element={<OrderSuccess />} />
                <Route path="/public/:storeCode/order-success/:orderNumber" element={<OrderSuccess />} />
                <Route path="/public/:storeCode/thank-you" element={<OrderSuccess />} />
                <Route path="/public/:storeCode/thank-you/:orderNumber" element={<OrderSuccess />} />
                
                {/* Customer authentication */}
                <Route path="/public/:storeCode/login" element={
                    <RoleProtectedRoute requiresAuth={false}>
                        <CustomerAuth />
                    </RoleProtectedRoute>
                } />
                <Route path="/public/:storeCode/register" element={
                    <RoleProtectedRoute requiresAuth={false}>
                        <CustomerAuth />
                    </RoleProtectedRoute>
                } />
                <Route path="/public/:storeCode/forgot-password" element={
                    <RoleProtectedRoute requiresAuth={false}>
                        <CustomerAuth />
                    </RoleProtectedRoute>
                } />
                
                {/* Customer account - shows login form if not authenticated, dashboard if authenticated */}
                <Route path="/public/:storeCode/account" element={<CustomerAuth />} />
                <Route path="/public/:storeCode/account/*" element={<CustomerAuth />} />
                <Route path="/public/:storeCode/my-account" element={<CustomerAuth />} />
                <Route path="/public/:storeCode/my-account/*" element={<CustomerAuth />} />
                
                {/* Customer orders */}
                <Route path="/public/:storeCode/orders" element={
                    <RoleProtectedRoute allowedRoles={['customer']}>
                        <Orders />
                    </RoleProtectedRoute>
                } />
                <Route path="/public/:storeCode/orders/:orderNumber" element={
                    <RoleProtectedRoute allowedRoles={['customer']}>
                        <Orders />
                    </RoleProtectedRoute>
                } />
                <Route path="/public/:storeCode/my-orders" element={
                    <RoleProtectedRoute allowedRoles={['customer']}>
                        <Orders />
                    </RoleProtectedRoute>
                } />
                <Route path="/public/:storeCode/my-orders/*" element={
                    <RoleProtectedRoute allowedRoles={['customer']}>
                        <Orders />
                    </RoleProtectedRoute>
                } />
                
                {/* =========================== */}
                {/* ADDITIONAL ADMIN ROUTES */}
                {/* =========================== */}
                
                <Route path="/admin/attributes" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Attributes />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/plugins" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Plugins />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/cms-blocks" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CmsBlocks />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/tax" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Tax />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/coupons" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Coupons />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/cms-pages" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CmsPages />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/product-tabs" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ProductTabs />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/product-labels" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ProductLabels />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/custom-option-rules" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CustomOptionRules />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/shipping-methods" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ShippingMethods />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/google-tag-manager" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <GoogleTagManager />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/delivery-settings" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <DeliverySettings />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/theme-layout" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ThemeLayout />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/marketplace-export" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <MarketplaceExport />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/image-manager" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ImageManager />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/stock-settings" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <StockSettings />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/payment-methods" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <PaymentMethods />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/seo-tools" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <SeoTools />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/stores" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Stores />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/customer-activity" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CustomerActivity />
                    </RoleProtectedRoute>
                } />
                
                {/* =========================== */}
                {/* PUBLIC CONTENT ROUTES */}
                {/* =========================== */}
                
                <Route path="/public/:storeCode/cms-page/:slug" element={<CmsPageViewer />} />
                
                <Route path="/public/:storeCode/sitemap" element={<HtmlSitemap />} />
                
                <Route path="/public/:storeCode/sitemap.xml" element={<XmlSitemap />} />
                
                <Route path="/public/:storeCode/robots.txt" element={<RobotsTxt />} />
                
                <Route path="/public/:storeCode/order-cancel" element={<OrderCancel />} />
                
                <Route path="/public/:storeCode/cookie-consent" element={<CookieConsent />} />
                
                
                {/* =========================== */}
                {/* SPECIAL ROUTES */}
                {/* =========================== */}
                
                <Route path="/landing" element={<Landing />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/client-dashboard" element={<ClientDashboard />} />
                
            </Routes>
        </StorefrontLayout>
    ) : (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Root redirect */}
                <Route path="/" element={<Landing />} />
                
                {/* =========================== */}
                {/* NEW URL STRUCTURE */}
                {/* =========================== */}
                
                {/* ADMIN ROUTES */}
                <Route path="/admin/login" element={
                    <RoleProtectedRoute requiresAuth={false}>
                        <Auth />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/dashboard" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Dashboard />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/products" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Products />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/categories" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Categories />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/orders" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Orders />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/customers" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Customers />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/settings" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Settings />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/analytics" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <AnalyticsSettings />
                    </RoleProtectedRoute>
                } />
                
                {/* =========================== */}
                {/* ADDITIONAL ADMIN ROUTES */}
                {/* =========================== */}
                
                <Route path="/admin/attributes" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Attributes />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/plugins" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Plugins />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/cms-blocks" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CmsBlocks />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/tax" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Tax />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/coupons" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Coupons />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/cms-pages" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CmsPages />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/product-tabs" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ProductTabs />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/product-labels" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ProductLabels />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/custom-option-rules" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CustomOptionRules />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/shipping-methods" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ShippingMethods />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/google-tag-manager" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <GoogleTagManager />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/delivery-settings" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <DeliverySettings />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/theme-layout" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ThemeLayout />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/marketplace-export" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <MarketplaceExport />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/image-manager" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <ImageManager />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/stock-settings" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <StockSettings />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/payment-methods" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <PaymentMethods />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/seo-tools" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <SeoTools />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/stores" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <Stores />
                    </RoleProtectedRoute>
                } />
                
                <Route path="/admin/customer-activity" element={
                    <RoleProtectedRoute allowedRoles={['store_owner', 'admin']}>
                        <CustomerActivity />
                    </RoleProtectedRoute>
                } />
                
                {/* =========================== */}
                {/* SPECIAL ROUTES */}
                {/* =========================== */}
                
                <Route path="/landing" element={<Landing />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/client-dashboard" element={<ClientDashboard />} />
                
            </Routes>
        </Layout>
    );
    
    // Wrap with StoreProvider if it's a public route
    return needsStoreProvider ? (
        <StoreProvider>
            {content}
        </StoreProvider>
    ) : content;
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}