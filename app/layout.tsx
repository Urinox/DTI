import type { Metadata } from "next"
import { Bricolage_Grotesque } from "next/font/google"
import "./globals.css"
import Providers from "@/components/SessionProvider"
import CleanDOM from "@/components/CleanDOM";
import HydrationFix from "./hydration-fix"

const bricolageGrotesque = Bricolage_Grotesque({
    weight: '400',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: "DTI Marinduque",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={bricolageGrotesque.className}>
            <body suppressHydrationWarning={true}>
                <HydrationFix />
                <CleanDOM />
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}