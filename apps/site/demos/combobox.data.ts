/** Customers for the combobox demos: name, then the city on the invoice address. */
export interface Customer {
  value: string;
  label: string;
  city: string;
}

export const CUSTOMERS: Customer[] = [
  { value: 'northwind', label: 'Northwind Traders', city: 'Seattle' },
  { value: 'contoso', label: 'Contoso Ltd', city: 'Dublin' },
  { value: 'fabrikam', label: 'Fabrikam', city: 'Rotterdam' },
  { value: 'tailspin', label: 'Tailspin Toys', city: 'Lyon' },
  { value: 'wingtip', label: 'Wingtip Partners', city: 'Leeds' },
  { value: 'adatum', label: 'Adatum Corporation', city: 'Munich' },
  { value: 'litware', label: 'Litware Inc', city: 'Toronto' },
];

/** Looks customers up as a server would, after a short wait. */
export function searchCustomers(query: string, signal: AbortSignal): Promise<Customer[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.trim().toLocaleLowerCase();
      resolve(
        CUSTOMERS.filter(
          (c) => c.label.toLocaleLowerCase().includes(q) || c.city.toLocaleLowerCase().includes(q),
        ),
      );
    }, 450);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
