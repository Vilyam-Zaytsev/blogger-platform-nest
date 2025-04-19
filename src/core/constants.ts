export const CONSTANTS = {
  MONGO_URL: process.env.MONGO_URL,
  // MONGO_URL: process.env.MONGO_URL_LOCAL,
  MONGO_QUERY: 'retryWrites=true&w=majority&appName=Cluster0',
  // DB_NAME: process.env.DB_NAME_LOCAL,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET_AT: process.env.JWT_SECRET_AT,
  JWT_SECRET_RT: process.env.JWT_SECRET_RT,
  JWT_EXPIRATION_AT: process.env.JWT_EXPIRATION_AT,
  JWT_EXPIRATION_RT: process.env.JWT_EXPIRATION_RT,
};
