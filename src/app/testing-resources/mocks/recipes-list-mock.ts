import { categoriesMock } from './categories-mock';
import { Recipe } from 'src/app/modules/recipes/models/recipes.model';

export const recipesListMock = [
  {
    date: new Date(),
    title: 'test',
    description: 'test',
    id: '1',
    ownerId: '2',
    steps: ['paso 2222', 'aaaa'],
    ingredients: ['ingrediente 1'],
    imgSrc: 'img-url.jpeg',
    private: true,
    categories: [categoriesMock[0]],
  },
  {
    date: new Date(),
    title: 'Relleno sándwich ensaladilla',
    description: 'Relleno sándwich ensaladilla',
    id: '2',
    ownerId: '2',
    steps: [
      'Cocer los huevos y reservar',
      'Introducimos el tomate en cuartos y pulsamos el botón turbo 5 segundos.',
      'Agregamos el huevo duro, el atún y la mayonesa y programamos la velocidad 4 durante 30 segundos. Retiramos a un bol y mezclamos con los guisantes, reservar en el frigorífico.',
    ],
    ingredients: [
      '100 gr de tomate',
      '50 gr guisantes cocidos',
      '60 gr mahonesa',
      '2 latas atún',
      '2 huevos',
    ],
    imgSrc: 'image-recipe-url.jpg',
    private: true,
    categories: [categoriesMock[1], categoriesMock[2]],
  },
] as Recipe[];
