import { ElementModel } from './element.model';
export interface Recipe {
  date: Date;
  description: string;
  title: string;
  steps: string[];
  ingredients: string[];
  id: string;
  ownerId?: string;
  imgSrc: string;
  private: boolean;
  categories: ElementModel[];
}
