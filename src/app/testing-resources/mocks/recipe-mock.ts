import { Recipe } from '../../modules/recipes/models/recipes.model';

export const recipeMock = {
  date: new Date(),
  title: 'Pisto',
  description: 'Pisto de calabacín, 30 minutos 2 raciones',
  id: '1',
  ownerId: '1',
  steps: [
    'Colocamos las cuchillas en su posición. Introducimos las verduras cortadas a grosso modo en la jarra de la mambo, programamos la velocidad 6 durante 7 segundos.\n',
    'Vertemos el aceite, salpimentamos y sofreímos a 120ºC, potencia de calor 10, velocidad 1 durante 6 minutos.\n',
    'Agregamos el tomate y el azúcar y programamos 120ºC, potencia de calor 7, velocidad 1 durante 20 minutos.\n',
    'Rectificamos el punto de sal si fuese necesario y listo.\n',
  ],
  ingredients: [
    '300 g de tomate en conserva\n',
    '100 g de berenjena\n',
    '100 g de calabacín\n',
    '100 g de pimiento verde\n',
    '100 g de pimiento rojo\n',
    ' 100 g de cebolla\n',
    '2 dientes de ajo\n',
    ' 25 ml de aceite de oliva\n',
    '1 cucharadita de azúcar\n',
    'Sal',
    'Pimienta',
  ],
  imgSrc: 'image-url-mocked.jpg',
  private: false,
} as Recipe;
