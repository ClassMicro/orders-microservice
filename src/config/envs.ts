
import 'dotenv/config';
import * as joi from 'joi';


interface EnvVars{
    PORT : number;
    // variables que vamos a utilizar para comunicarnos con el microservicio de productos
    PRODUCT_MICROSSERVICE_HOST: string;
    PRODUCT_MICROSSERVICE_PORT: number;
    
    // variables de entorno que vamos a utilizar para la conexion a la base de datos
    DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASS: string;
    DB_NAME: string;
}
// son los datos de entorno que vammos a validar y que se tienen que definir
// si no se definen lanzamos un error
const envschema = joi.object({
    PORT: joi.number().required(),
    PRODUCT_MICROSSERVICE_HOST: joi.string().required(),
    PRODUCT_MICROSSERVICE_PORT: joi.number().required(),
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().required(),
    DB_USER: joi.string().required(),
    DB_PASS: joi.string().required(),
    DB_NAME: joi.string().required(),
}).unknown(true);

const {error , value  } = envschema.validate(process.env);

if (error) {
    throw new Error(`configuracion de validacion de entorno: ${error.message}`);
}

const envVars : EnvVars = value;


export const envs ={
    port : envVars.PORT,
    productMicroserviceHost: envVars.PRODUCT_MICROSSERVICE_HOST,
    productMicroservicePort: envVars.PRODUCT_MICROSSERVICE_PORT,
    dbHost: envVars.DB_HOST,
    dbPort: envVars.DB_PORT,
    dbUser: envVars.DB_USER,
    dbPass: envVars.DB_PASS,
    dbName: envVars.DB_NAME,
}