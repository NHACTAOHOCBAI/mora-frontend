import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="mora-theme">
      <QueryProvider>
        <AppRoutes />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  )
}

export default App
