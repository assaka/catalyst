import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Unified PageLoader component for consistent loading states across the application.
 *
 * @param {string} size - Size of the loader: "sm" (16px), "md" (32px), "lg" (48px), "xl" (64px)
 * @param {boolean} fullScreen - Whether to display full-screen centered loader
 * @param {string} className - Additional CSS classes
 * @param {string} text - Optional loading text to display below spinner
 */
const PageLoader = React.forwardRef(({
  size = "lg",
  fullScreen = true,
  className,
  text,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  const containerClasses = fullScreen
    ? "min-h-screen flex flex-col items-center justify-center bg-gray-50"
    : "flex flex-col items-center justify-center"

  return (
    <div ref={ref} className={cn(containerClasses, className)} {...props}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-blue-600")} />
      {text && (
        <p className="mt-4 text-sm text-gray-600">{text}</p>
      )}
    </div>
  )
})

PageLoader.displayName = "PageLoader"

export { PageLoader }
