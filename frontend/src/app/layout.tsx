import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes'; // Optional: for dark mode style
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body className="bg-slate-950 text-white">
          {/* Global Navigation Bar */}
          <nav className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            
            {/* Logo */}
            <div className="text-xl font-bold text-blue-500 flex items-center gap-2">
              ZOOM CLONE
            </div>

            {/* User Profile / Dropdown */}
            <div className="flex items-center gap-4">
              <SignedIn>
                {/* UserButton handles everything:
                  - Shows the Avatar
                  - showName={true} -> Shows "Rishabh Singh" next to it
                  - Clicking it opens the "Manage Account / Settings" dropdown
                */}
                <UserButton 
                  showName={true} 
                  appearance={{
                    elements: {
                      userButtonBox: "flex flex-row-reverse", // Optional: puts text on left of avatar
                      userButtonOuterIdentifier: "text-slate-200 font-medium text-sm",
                    }
                  }}
                />
              </SignedIn>
            </div>
          </nav>

          {/* Main Content */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}