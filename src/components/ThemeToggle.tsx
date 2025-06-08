import { Moon, Sun, Sword, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: 'default' | 'mobile-sheet';
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get adventure theme styling based on variant - matching combobox styling
  const getAdventureClasses = () => {
    if (variant === 'mobile-sheet') {
      // Mobile sheet has light background, needs dark text
      return "adventure:bg-transparent adventure:border-stone-400 adventure:text-stone-700 adventure:hover:bg-stone-700/50 adventure:hover:text-stone-100";
    } else {
      // Desktop header - match combobox styling exactly
      return "adventure:!bg-stone-700 adventure:!border-stone-600 adventure:!text-stone-200 adventure:hover:!bg-stone-600 adventure:hover:!text-stone-100";
    }
  };

  // Get theme display name
  const getThemeDisplayName = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'adventure': return 'Adventure';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size={variant === 'mobile-sheet' ? 'sm' : 'icon'}
        disabled
        className={cn(
          getAdventureClasses(),
          variant === 'mobile-sheet' && "flex-1 justify-start gap-2"
        )}
      >
        {variant === 'mobile-sheet' ? (
          <>
            <Monitor className="h-4 w-4" />
            System
          </>
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        )}
      </Button>
    )
  }

  // Get theme icon
  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'adventure': return <Sword className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  if (variant === 'mobile-sheet') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(getAdventureClasses(), "flex-1 justify-start gap-2")}
          >
            {mounted ? getThemeIcon() : <Monitor className="h-4 w-4" />}
            {getThemeDisplayName()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("adventure")}>
            <Sword className="mr-2 h-4 w-4" />
            Adventure
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={cn(getAdventureClasses())}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 adventure:-rotate-90 adventure:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 adventure:rotate-90 adventure:scale-0" />
          <Sword className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all adventure:rotate-0 adventure:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("adventure")}>
          <Sword className="mr-2 h-4 w-4" />
          Adventure
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}