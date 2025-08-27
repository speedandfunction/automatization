export interface History {
  rate: { [date: string]: number };
  contractType?: { [date: string]: string };
}

export interface Employee {
  /**
   * Redmine user ID (links to the corresponding user in Redmine)
   */
  redmine_id: number;
  history?: History;
  [key: string]: unknown;
}

export interface Project {
  /**
   * Project name
   */
  name: string;
  /**
   * Redmine project ID (links to the corresponding project in Redmine)
   */
  redmine_id: number;
  /**
   * QuickBooks Online Customer ID (links to the QBO Customer entity)
   */
  quick_books_id?: number;
  history?: History;
  effectiveRevenue?: number;
  [key: string]: unknown;
}

export interface FinancialsAppData {
  projects: Project[];
  employees: Employee[];
}
