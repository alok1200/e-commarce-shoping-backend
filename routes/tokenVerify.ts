import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload | string;
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.token as string;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err, user) => {
      if (err) {
        res.status(403).json({ message: "token is not valid" });
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    res.status(401).json({ message: "You are not Loged in" });
  }
};

export const verifyUserWithToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  verifyToken(req, res, () => {
    if (
      typeof req.user === "object" &&
      (req.user?.id === req.params.id || req.user?.isAdmin === true)
    ) {
      next();
    } else {
      res.status(403).json({ message: "you are not allowed to do that" });
    }
  });
};

export const verifyAdminWithToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  verifyToken(req, res, () => {
    if (typeof req.user === "object" && req.user?.isAdmin === true) {
      next();
    } else {
      res.status(403).json({ message: "you are not allowed to do that" });
    }
  });
};
