import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { NavTop } from '@/components/nav-top';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppTopNavLayout({ children }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="header">
            <NavTop />
            <AppContent variant="header" className="px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </AppContent>
        </AppShell>
    );
}
