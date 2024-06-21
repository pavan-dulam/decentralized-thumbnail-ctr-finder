export const JWT_SECRET = process.env.JWT_SECRET ?? 'ppvds8734inids8dsndh';
export const WORKER_JWT_SECRET = JWT_SECRET + 'worker';
export const ACCESS_KEY = process.env.ACCESS_KEY || '';
export const SECRET_KEY = process.env.SECRET_KEY || '';
export const REGION = process.env.REGION || '';
export const TOTAL_DECIMALS = 1000_000;
export const TOTAL_SUBMISSIONS = 100;
