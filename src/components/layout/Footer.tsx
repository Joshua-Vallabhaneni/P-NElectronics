import { Recycle, Mail } from 'lucide-react';
import { Footer as FooterUI } from '@/components/ui/footer';

export function Footer() {
    return (
        <FooterUI
            logo={
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Recycle className="w-4 h-4 text-white" />
                </div>
            }
            brandName="P&N Electronics"
            socialLinks={[
                {
                    icon: <Mail className="h-5 w-5" />,
                    href: "https://mail.google.com/mail/?view=cm&fs=1&to=pnelectronicsllc@gmail.com&su=General%20Inquiry%20-%20P%26N%20Electronics&body=Hi%20P%26N%20Electronics",
                    label: "Email Support",
                },
            ]}
            mainLinks={[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/inventory", label: "Inventory" },
                { href: "/sell", label: "Sell To Us" },
            ]}
            legalLinks={[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
            ]}
            copyright={{
                text: `© ${new Date().getFullYear()} P&N Electronics`,
                license: "All rights reserved",
            }}
        />
    );
}
