import swaggerJsdoc from "swagger-jsdoc";
import listners from "../utils/listnerHandler.js";
import { config } from "dotenv";

const servers = listners.map(listner => {
    return {
        url: `http://${listner.adress}:${process.env.PORT}`,
        description: `${listner.name} Server`
    }
})



const options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "LMS API",
            version: "1.0.0",
            description: "Learning Management System API",
        },
        
        components: {
            securitySchemes: {
                bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                },
            },
        },

        servers,
    },
    apis: ["./docs/swagger/*.swagger.yaml"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
