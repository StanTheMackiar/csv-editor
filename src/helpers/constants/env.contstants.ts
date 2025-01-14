type Enviroment = 'development' | 'production';

export const ENVIROMENT: Enviroment =
  (process.env.NEXT_PUBLIC_ENVIROMENT as Enviroment) ?? 'development';

export const IS_PROD = ENVIROMENT === 'production';
export const IS_DEV = ENVIROMENT === 'development';
