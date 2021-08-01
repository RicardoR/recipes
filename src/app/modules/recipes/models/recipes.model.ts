export interface Recipe {
  date: Date,
  description: string,
  title: string,
  steps: string[],
  id?: string,
  ownerId?: string;
}
