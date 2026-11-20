export interface Notification {
  id: string;
  unread: boolean;
  title: string;
  detail: string;
  time: string;
  href: string;
}

export const NOTIFICATIONS: readonly Notification[] = [
  {
    id: 'n1',
    unread: true,
    title: 'Quayside Hotels paid in full',
    detail: 'Matched to the AIB bank feed this morning',
    time: '9 min ago',
    href: '/invoices',
  },
  {
    id: 'n2',
    unread: true,
    title: 'Nine expenses wait for your decision',
    detail: 'Two are flagged by the spend policy',
    time: '1 h ago',
    href: '/expenses',
  },
  {
    id: 'n3',
    unread: true,
    title: 'Payroll for November runs on Wednesday',
    detail: 'Fund the current account by Tuesday 17:00',
    time: '3 h ago',
    href: '/journal',
  },
  {
    id: 'n4',
    unread: false,
    title: 'October closed by Rory Quinn',
    detail: 'Journal locked, reports ready',
    time: '12 Nov',
    href: '/reports',
  },
];
