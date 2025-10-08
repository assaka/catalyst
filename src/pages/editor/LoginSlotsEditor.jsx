/**
 * LoginSlotsEditor - Login/Auth page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports login customization
 * - Maintainable structure
 */

import { LogIn, UserPlus } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { loginConfig } from '@/components/editor/slot/configs/login-config';

// Generate login context based on view mode
const generateLoginContext = (viewMode) => ({
  authMode: viewMode === 'register' ? 'register' : 'login',
  showSocialLogin: true,
  redirectUrl: null
});

// Login Editor Configuration
const loginEditorConfig = {
  pageType: 'login',
  pageName: 'Login/Register',
  slotType: 'login_layout',
  defaultViewMode: 'login',
  viewModes: loginConfig.views.map(view => ({
    key: view.id,
    label: view.label,
    icon: view.icon
  })),
  slotComponents: {},
  generateContext: generateLoginContext,
  viewModeAdjustments: {},
  cmsBlockPositions: loginConfig.cmsBlocks,
  // Include the config data for reference
  slots: loginConfig.slots,
  metadata: loginConfig.metadata,
  views: loginConfig.views,
  cmsBlocks: loginConfig.cmsBlocks
};

const LoginSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'login'
}) => {
  return (
    <UnifiedSlotsEditor
      config={loginEditorConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default LoginSlotsEditor;
