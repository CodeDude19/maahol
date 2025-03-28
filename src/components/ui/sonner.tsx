
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={1000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/20 group-[.toaster]:backdrop-blur-lg group-[.toaster]:border group-[.toaster]:border-white/20 group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:py-1 group-[.toaster]:px-2 group-[.toaster]:min-h-0",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
