import { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';

/**
 * Swagger configuration for API documentation
 */
export const swaggerSetup = () => {
  const openApiPath = path.join(__dirname, '../../openapi.json');
  
  // Check if openapi.json exists
  if (!fs.existsSync(openApiPath)) {
    console.warn('[Swagger] openapi.json not found at:', openApiPath);
    return {
      serve: swaggerUi.serve,
      setup: swaggerUi.setup({
        openapi: '3.0.0',
        info: {
          title: 'TutorConnected API',
          version: '1.0.0',
          description: 'API documentation not yet generated. Please create openapi.json file.',
        },
        paths: {},
      }),
    };
  }

  try {
    const swaggerDocument = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
    
    const options = {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'TutorConnected API Docs',
    };

    return {
      serve: swaggerUi.serve,
      setup: swaggerUi.setup(swaggerDocument, options),
    };
  } catch (error) {
    console.error('[Swagger] Error loading openapi.json:', error);
    return {
      serve: swaggerUi.serve,
      setup: swaggerUi.setup({
        openapi: '3.0.0',
        info: {
          title: 'TutorConnected API',
          version: '1.0.0',
          description: 'Error loading API documentation.',
        },
        paths: {},
      }),
    };
  }
};

/**
 * Middleware to add CORS headers for Swagger UI
 */
export const swaggerCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
};
