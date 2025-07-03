"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useI18n } from "@/hooks/use-i18n"

export function Toaster() {
  const { toasts } = useToast()
  const { t } = useI18n()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, titleKey, titleParams, descriptionKey, descriptionParams, ...props }) {
        const finalTitle = titleKey ? t(titleKey, titleParams) : title;
        const finalDescription = descriptionKey ? t(descriptionKey, descriptionParams) : description;
        
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {finalTitle && <ToastTitle>{finalTitle}</ToastTitle>}
              {finalDescription && (
                <ToastDescription>{finalDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
