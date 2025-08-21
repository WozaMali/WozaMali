import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

export function ThemeIndicator() {
  const { theme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeText = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
      default:
        return 'System'
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      {getThemeIcon()}
      <span>{getThemeText()} Mode</span>
    </div>
  )
}
