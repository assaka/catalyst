/**
 * LoginSlotsEditor - Login/Auth page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports login customization
 * - Maintainable structure
 */

import { LogIn, UserPlus } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";

// Login page configuration
const loginConfig = {
  slotLayout: {
    login_header: { name: 'Login Header', colSpan: 12, order: 0 },
    login_form: { name: 'Login Form', colSpan: 6, order: 1 },
    register_form: { name: 'Register Form', colSpan: 6, order: 2 },
    login_footer: { name: 'Login Footer', colSpan: 12, order: 3 },
    social_login: { name: 'Social Login', colSpan: 12, order: 4 }
  },
  views: [
    {
      id: 'login',
      label: 'Login View',
      icon: LogIn,
      description: 'Customer login page'
    },
    {
      id: 'register',
      label: 'Register View',
      icon: UserPlus,
      description: 'Customer registration page'
    }
  ],
  cmsBlocks: ['login_header', 'login_footer', 'social_login']
};

// Generate login context based on view mode
const generateLoginContext = (viewMode) => ({
  authMode: viewMode === 'register' ? 'register' : 'login',
  showSocialLogin: true,
  redirectUrl: null
});

// Login Editor Configuration
const loginEditorConfig = {
  ...loginConfig,
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
  cmsBlockPositions: loginConfig.cmsBlocks
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
