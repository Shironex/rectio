export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: readonly string[];
  taxId: string;
  /** VAT charged on our invoices: 23% in Ireland, reverse charge (0) for EU and export buyers. */
  vatRate: number;
  /** Payment terms in days. */
  terms: number;
}

export const CUSTOMERS: readonly Customer[] = [
  {
    id: 'nordwind',
    name: 'Nordwind Logistik GmbH',
    contact: 'Katrin Albers',
    email: 'ap@nordwind-logistik.de',
    address: ['Grosse Elbstrasse 145', '22767 Hamburg', 'Germany'],
    taxId: 'DE 318447902',
    vatRate: 0,
    terms: 30,
  },
  {
    id: 'kestrel',
    name: 'Kestrel Analytics Ltd',
    contact: 'Ronan Fitzgerald',
    email: 'finance@kestrelanalytics.ie',
    address: ['3 Grand Canal Quay', 'Dublin D02 R590', 'Ireland'],
    taxId: 'IE 6388047V',
    vatRate: 0.23,
    terms: 30,
  },
  {
    id: 'barrett',
    name: 'Barrett Furniture Ltd',
    contact: 'Siobhan Barrett',
    email: 'accounts@barrettfurniture.ie',
    address: ['Unit 4, Mahon Business Park', 'Cork T12 AB34', 'Ireland'],
    taxId: 'IE 8274915KH',
    vatRate: 0.23,
    terms: 45,
  },
  {
    id: 'lune',
    name: 'Atelier Lune SARL',
    contact: 'Camille Roux',
    email: 'compta@atelierlune.fr',
    address: ['22 rue Mercière', '69002 Lyon', 'France'],
    taxId: 'FR 42853119427',
    vatRate: 0,
    terms: 30,
  },
  {
    id: 'vantaa',
    name: 'Vantaa Foods Oy',
    contact: 'Mikko Heinonen',
    email: 'laskut@vantaafoods.fi',
    address: ['Tikkurilantie 10', '01300 Vantaa', 'Finland'],
    taxId: 'FI 28741563',
    vatRate: 0,
    terms: 30,
  },
  {
    id: 'cobh',
    name: 'Cobh Rail Services Ltd',
    contact: 'Siobhán Keane',
    email: 'accounts@cobhrail.ie',
    address: ['Unit 4, Ringaskiddy Business Park', 'Cork P43 X620', 'Ireland'],
    taxId: 'IE 9871204K',
    vatRate: 0.23,
    terms: 30,
  },
  {
    id: 'pardo',
    name: 'Pardo & Hijos SL',
    contact: 'Lucía Pardo',
    email: 'administracion@pardohijos.es',
    address: ['Carrer de Colón 18', '46004 València', 'Spain'],
    taxId: 'ES B98436172',
    vatRate: 0,
    terms: 30,
  },
  {
    id: 'greywell',
    name: 'Greywell Partners',
    contact: 'Declan Moran',
    email: 'billing@greywell.ie',
    address: ['Eyre Square House', 'Galway H91 E2K4', 'Ireland'],
    taxId: 'IE 3307719BH',
    vatRate: 0.23,
    terms: 14,
  },
  {
    id: 'halvorsen',
    name: 'Halvorsen Marine AS',
    contact: 'Ingrid Halvorsen',
    email: 'accounts@halvorsenmarine.no',
    address: ['Bryggen 9', '5003 Bergen', 'Norway'],
    taxId: 'NO 921604338 MVA',
    vatRate: 0,
    terms: 30,
  },
  {
    id: 'brennan',
    name: 'Brennan & Moy Solicitors',
    contact: 'Aisling Brennan',
    email: 'office@brennanmoy.ie',
    address: ['48 O’Connell Street', 'Limerick V94 TK21', 'Ireland'],
    taxId: 'IE 4471092UA',
    vatRate: 0.23,
    terms: 30,
  },
  {
    id: 'oakhaven',
    name: 'Oakhaven Dental Group',
    contact: 'Dr Eoin Gallagher',
    email: 'finance@oakhavendental.ie',
    address: ['Block C, Sandyford Office Park', 'Dublin D18 W2P7', 'Ireland'],
    taxId: 'IE 3521876TH',
    vatRate: 0.23,
    terms: 30,
  },
  {
    id: 'lindgren',
    name: 'Lindgren Bygg AB',
    contact: 'Erik Lindgren',
    email: 'ekonomi@lindgrenbygg.se',
    address: ['Stortorget 7', '211 22 Malmö', 'Sweden'],
    taxId: 'SE 556812447101',
    vatRate: 0,
    terms: 30,
  },
  {
    id: 'tessaro',
    name: 'Tessaro Ceramiche Srl',
    contact: 'Giulia Tessaro',
    email: 'amministrazione@tessaro.it',
    address: ['Via Emilia Levante 61', '48018 Faenza RA', 'Italy'],
    taxId: 'IT 02874150398',
    vatRate: 0,
    terms: 45,
  },
  {
    id: 'quayside',
    name: 'Quayside Hotels Ltd',
    contact: 'Gráinne Power',
    email: 'payables@quaysidehotels.ie',
    address: ['The Quay', 'Waterford X91 PX28', 'Ireland'],
    taxId: 'IE 8264490M',
    vatRate: 0.23,
    terms: 30,
  },
];

export function customerByName(name: string): Customer | undefined {
  return CUSTOMERS.find((c) => c.name === name);
}
