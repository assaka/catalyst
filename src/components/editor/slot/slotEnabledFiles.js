import { ShoppingCart, Package, CreditCard, CheckCircle, Grid3X3, Menu, User, LogIn } from 'lucide-react';

/**
 * Slot-enabled files configuration
 * Shared configuration for all slot-based page editors
 */
export const slotEnabledFiles = [
  {
    id: 'header',
    name: 'Header',
    path: 'src/pages/editor/HeaderSlotsEditor.jsx',
    pageType: 'header',
    icon: Menu,
    description: 'Header and navigation customization',
    color: 'text-indigo-500'
  },
  {
    id: 'cart',
    name: 'Cart',
    path: 'src/pages/editor/CartSlotsEditor.jsx',
    pageType: 'cart',
    icon: ShoppingCart,
    description: 'Shopping cart page with slot customization',
    color: 'text-blue-500'
  },
  {
    id: 'category',
    name: 'Category',
    path: 'src/pages/editor/CategorySlotsEditor.jsx',
    pageType: 'category',
    icon: Grid3X3,
    description: 'Product category listing page',
    color: 'text-green-500'
  },
  {
    id: 'product',
    name: 'Product',
    path: 'src/pages/editor/ProductSlotsEditor.jsx',
    pageType: 'product',
    icon: Package,
    description: 'Product detail page with customizable slots',
    color: 'text-purple-500'
  },
  {
    id: 'account',
    name: 'Account',
    path: 'src/pages/editor/AccountSlotsEditor.jsx',
    pageType: 'account',
    icon: User,
    description: 'Customer account page customization',
    color: 'text-pink-500'
  },
  {
    id: 'login',
    name: 'Login',
    path: 'src/pages/editor/LoginSlotsEditor.jsx',
    pageType: 'login',
    icon: LogIn,
    description: 'Login and registration page customization',
    color: 'text-teal-500'
  },
  {
    id: 'checkout',
    name: 'Checkout',
    path: 'src/pages/editor/CheckoutSlotsEditor.jsx',
    pageType: 'checkout',
    icon: CreditCard,
    description: 'Checkout flow with payment integration',
    color: 'text-orange-500',
    comingSoon: false
  },
  {
    id: 'success',
    name: 'Success',
    path: 'src/pages/editor/SuccessSlotsEditor.jsx',
    pageType: 'success',
    icon: CheckCircle,
    description: 'Order confirmation and success page',
    color: 'text-emerald-500',
    comingSoon: false
  }
];
