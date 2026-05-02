import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="down">
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-xl">
              <div 
                className={`h-full rounded-b-xl animate-toast-progress ${
                  variant === 'destructive' ? 'bg-red-400/60' : 
                  variant === 'success' ? 'bg-green-400/60' : 
                  'bg-gray-400/40'
                }`}
                style={{ animationDuration: `${duration || 3500}ms` }}
              />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
