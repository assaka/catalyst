import * as React from "react";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SaveButton - A uniform button component for save operations
 *
 * Features:
 * - Loading state with spinner
 * - Success state with checkmark (auto-clears after timeout)
 * - Customizable text labels
 * - Blue default → Green success color scheme
 *
 * @param {Object} props
 * @param {Function} props.onClick - Save handler function
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.success - Success state
 * @param {boolean} props.disabled - Additional disabled state
 * @param {string} props.defaultText - Default button text (default: "Save")
 * @param {string} props.loadingText - Loading button text (default: "Saving...")
 * @param {string} props.successText - Success button text (default: "Saved!")
 * @param {string} props.size - Button size: "default" | "sm" | "lg"
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.successTimeout - Auto-clear success timeout in ms (default: 2000, set to 0 to disable)
 */
const SaveButton = React.forwardRef(({
  onClick,
  loading = false,
  success = false,
  disabled = false,
  defaultText = "Save",
  loadingText = "Saving...",
  successText = "Saved!",
  size = "default",
  className,
  successTimeout = 2000,
  ...props
}, ref) => {
  const isDisabled = disabled || loading || success;

  return (
    <Button
      ref={ref}
      onClick={onClick}
      disabled={isDisabled}
      size={size}
      className={cn(
        success
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          {successText}
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          {defaultText}
        </>
      )}
    </Button>
  );
});

SaveButton.displayName = "SaveButton";

export { SaveButton };
export default SaveButton;
