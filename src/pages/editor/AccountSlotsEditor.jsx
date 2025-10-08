/**
 * AccountSlotsEditor - Customer account page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports account customization
 * - Maintainable structure
 */

import { User, UserCircle } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";

// Account page configuration
const accountConfig = {
  slotLayout: {
    account_header: { name: 'Account Header', colSpan: 12, order: 0 },
    account_navigation: { name: 'Account Navigation', colSpan: 3, order: 1 },
    account_content: { name: 'Account Content', colSpan: 9, order: 2 },
    account_sidebar: { name: 'Account Sidebar', colSpan: 12, order: 3 },
    account_footer: { name: 'Account Footer', colSpan: 12, order: 4 }
  },
  views: [
    {
      id: 'overview',
      label: 'Account Overview',
      icon: User,
      description: 'Customer account dashboard'
    },
    {
      id: 'profile',
      label: 'Profile View',
      icon: UserCircle,
      description: 'Customer profile page'
    }
  ],
  cmsBlocks: ['account_header', 'account_sidebar', 'account_footer']
};

// Generate account context based on view mode
const generateAccountContext = (viewMode) => ({
  user: {
    id: 1,
    full_name: 'John Doe',
    email: 'john@example.com',
    role: 'customer'
  },
  activeTab: viewMode === 'profile' ? 'profile' : 'overview',
  orders: [],
  addresses: [],
  wishlistItems: []
});

// Account Editor Configuration
const accountEditorConfig = {
  ...accountConfig,
  pageType: 'account',
  pageName: 'Customer Account',
  slotType: 'account_layout',
  defaultViewMode: 'overview',
  viewModes: accountConfig.views.map(view => ({
    key: view.id,
    label: view.label,
    icon: view.icon
  })),
  slotComponents: {},
  generateContext: generateAccountContext,
  viewModeAdjustments: {},
  cmsBlockPositions: accountConfig.cmsBlocks
};

const AccountSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'overview'
}) => {
  return (
    <UnifiedSlotsEditor
      config={accountEditorConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default AccountSlotsEditor;
