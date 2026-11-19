'use client';

import { BankIcon, BellIcon, ChartBarIcon, ReceiptIcon } from '@phosphor-icons/react';
import {
  Button,
  NavigationBar,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
} from '@rectio/ui';
import type { MouseEvent } from 'react';

/** The docs page must not jump on a click; in an app these are your router's links. */
const stay = (event: MouseEvent) => {
  event.preventDefault();
};

export default function NavigationMenuDemo() {
  return (
    <div className="w-full overflow-hidden rounded-panel border border-line">
      <NavigationBar
        brand={<span className="font-display text-lg text-fg">Harbour &amp; Finch</span>}
        mobileMenuLabel="Menu"
        mobileMenu={(close) => (
          <ul className="flex flex-col gap-1 text-base">
            {['Receivables', 'Payables', 'Reports'].map((name) => (
              <li key={name}>
                <a
                  href={`#${name.toLowerCase()}`}
                  className="block rounded-control px-3 py-2 text-fg hover:bg-surface-hover"
                  onClick={(event) => {
                    event.preventDefault();
                    close();
                  }}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        )}
        actions={
          <Button variant="ghost" iconOnly aria-label="Notifications">
            <BellIcon aria-hidden weight="bold" className="size-4" />
          </Button>
        }
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#overview" active onClick={stay}>
                Overview
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Receivables</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanelLink
                  href="#invoices"
                  onClick={stay}
                  icon={<ReceiptIcon weight="bold" className="size-4" />}
                  title="Invoices"
                  description="Issue, send and chase what customers owe."
                />
                <NavigationMenuPanelLink
                  href="#aging"
                  onClick={stay}
                  icon={<ChartBarIcon weight="bold" className="size-4" />}
                  title="Aging"
                  description="Who is late, and by how much."
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Payables</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanelLink
                  href="#bills"
                  onClick={stay}
                  icon={<BankIcon weight="bold" className="size-4" />}
                  title="Bills"
                  description="Approve and schedule supplier payments."
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </NavigationBar>
    </div>
  );
}
