import 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      // Augment user injected by auth middleware
      user: any;
    }
  }
}

export {};
