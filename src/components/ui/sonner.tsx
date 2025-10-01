import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-900 group-[.toaster]:text-gray-900 group-[.toaster]:dark:text-gray-100 group-[.toaster]:border-gray-200 group-[.toaster]:dark:border-gray-700 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-600 group-[.toast]:dark:text-gray-400",
          actionButton:
            "group-[.toast]:bg-yellow-500 group-[.toast]:text-white group-[.toast]:hover:bg-yellow-600",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:dark:bg-gray-800 group-[.toast]:text-gray-700 group-[.toast]:dark:text-gray-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
