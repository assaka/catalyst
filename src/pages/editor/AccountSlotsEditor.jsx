/**
 * AccountSlotsEditor - Customer account page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports account customization
 * - Maintainable structure
 */

import { User, UserCircle } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { accountConfig } from '@/components/editor/slot/configs/account-config';

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
