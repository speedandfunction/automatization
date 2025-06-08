export interface History {
  rate: { [date: string]: number };
}

export interface Employee {
  redmine_id: number;
  history?: History;
}

export interface Project {
  redmine_id: number;
  quick_books_id?: number;
  history?: History;
}
