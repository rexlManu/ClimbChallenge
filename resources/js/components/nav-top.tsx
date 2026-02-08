import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/',
    },
    // Add more items here as needed
];

export function NavTop() {
    const { auth } = usePage<SharedData>().props;
    const page = usePage();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6 md:gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <AppLogo />
                    </Link>
                    <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                        {mainNavItems.map((item) => {
                            const isActive = item.href === '/' ? page.url === '/' : page.url.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <div className="ml-auto flex items-center space-x-4">
                        {auth.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 outline-none">
                                        <UserInfo user={auth.user} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-medium hover:underline">
                                    Log in
                                </Link>
                                <Link href="/register" className="text-sm font-medium hover:underline">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
