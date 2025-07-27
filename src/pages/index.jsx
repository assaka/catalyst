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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Landing />} />
                
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Auth" element={<Auth />} />
                
                <Route path="/CustomerAuth" element={<CustomerAuth />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Products" element={<Products />} />
                
                <Route path="/Categories" element={<Categories />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Attributes" element={<Attributes />} />
                
                <Route path="/Plugins" element={<Plugins />} />
                
                <Route path="/Storefront" element={<Storefront />} />
                <Route path="/:storeCode/storefront" element={<Storefront />} />
                <Route path="/:storeCode/productdetail" element={<ProductDetail />} />
                <Route path="/:storeCode/cart" element={<Cart />} />
                <Route path="/:storeCode/checkout" element={<Checkout />} />
                <Route path="/:storeCode/order-success" element={<OrderSuccess />} />
                
                <Route path="/ProductDetail" element={<ProductDetail />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/CmsBlocks" element={<CmsBlocks />} />
                
                <Route path="/Checkout" element={<Checkout />} />
                
                <Route path="/Tax" element={<Tax />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/CustomerDashboard" element={<CustomerDashboard />} />
                
                <Route path="/Coupons" element={<Coupons />} />
                
                <Route path="/CmsPages" element={<CmsPages />} />
                
                <Route path="/CmsPageViewer" element={<CmsPageViewer />} />
                
                <Route path="/ProductTabs" element={<ProductTabs />} />
                
                <Route path="/ProductLabels" element={<ProductLabels />} />
                
                <Route path="/CustomOptionRules" element={<CustomOptionRules />} />
                
                <Route path="/OrderSuccess" element={<OrderSuccess />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                
                <Route path="/ShippingMethods" element={<ShippingMethods />} />
                
                <Route path="/GoogleTagManager" element={<GoogleTagManager />} />
                
                <Route path="/DeliverySettings" element={<DeliverySettings />} />
                
                <Route path="/ThemeLayout" element={<ThemeLayout />} />
                
                <Route path="/MarketplaceExport" element={<MarketplaceExport />} />
                
                <Route path="/ImageManager" element={<ImageManager />} />
                
                <Route path="/HtmlSitemap" element={<HtmlSitemap />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/StockSettings" element={<StockSettings />} />
                
                <Route path="/AnalyticsSettings" element={<AnalyticsSettings />} />
                
                <Route path="/PaymentMethods" element={<PaymentMethods />} />
                
                <Route path="/SeoTools" element={<SeoTools />} />
                
                <Route path="/XmlSitemap" element={<XmlSitemap />} />
                
                <Route path="/RobotsTxt" element={<RobotsTxt />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/ClientDashboard" element={<ClientDashboard />} />
                
                <Route path="/Stores" element={<Stores />} />
                
                <Route path="/OrderCancel" element={<OrderCancel />} />
                
                <Route path="/CustomerActivity" element={<CustomerActivity />} />
                
                <Route path="/CookieConsent" element={<CookieConsent />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}