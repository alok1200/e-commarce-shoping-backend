import { Request, Response, NextFunction } from "express";
import { Model, Document } from "mongoose";

// Extend Express Response to add paginatedResults
declare module "express-serve-static-core" {
  interface Response {
    paginatedResults?: any;
  }
}

const paginate =
  <T extends Document>(model: Model<T>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    try {
      const count = await model.countDocuments().exec();
      const pages = Math.ceil(count / limit);

      const results = {
        data: await model.find().skip(startIndex).limit(limit).exec(),
        meta: {
          total: count,
          pages,
          page,
          limit,
          prev_page: page > 1 ? page - 1 : null,
          next_page: page < pages ? page + 1 : null,
        },
      };

      res.paginatedResults = results;
      next();
    } catch (err) {
      next(err);
    }
  };

export default paginate;
