import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="mora-theme">
      <TooltipProvider>
        <QueryProvider>
          <AppRoutes />
          <Toaster />
        </QueryProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
