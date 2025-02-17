import { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";
import User, { IUser } from "models/userModels.js";
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";

interface JwtPayload {
    userId: string
}

interface CustomRequest extends Request {
  user?: IUser;
}

const protect = wrapAsync(async (req: Request, res, next) => {
  let token;

  token = req.cookies.jwtToken;
  //   token = req.header['authorisation'].split(' ')[1]

  if (token) {
    if (!process.env.JWT_SECRET_KEY) {
      return next(new ExpressError(500, "Token value is undefined"));
    }

    try {
      const decode = Jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;

      if (!decode.userId) {
        return next(new ExpressError(401, "Invalid token: userId not found"));
      }

      const user = await User.findById(decode.userId).select("-password");

      if (!user) {
        return next(new ExpressError(404, "User not found"));
      }

      req.user = user;

      next();
    } catch (error) {
      return next(new ExpressError(401, "Invalid token"));
    }
  } else {
    return next(new ExpressError(401, "No token provided"));
  }
});

const customRole = (...roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ExpressError(401, "User not authenticated"));
    }

    // If 'admin' role is required and user has isAdmin = true, allow access
    if (roles.includes("admin") && req.user.isAdmin) {
      return next();
    }

    if (!roles.includes(req.user.accountType)) {
      return next(new ExpressError(403, `Not authorized, required roles: ${roles.join(", ")}`));
    }

    next();
  };
};

// const isStudent = (req: Request, res: Response, next: NextFunction) => {
//     const isStudent = req.user?.accountType === 'student'
//     if(isStudent) {
//         next()
//     } else {
//         next(new ExpressError(401, 'Not authorized, as Student'))
//     }
// };


// const isAdmin = (req: Request, res: Response, next: NextFunction) => {
//     const isAdmin = req.user?.isAdmin
//     if(req.user && isAdmin) {
//         next()
//     } else {
//         next(new ExpressError(401, 'Not authorized, as Admin'))
//     }
// };


// const isInstructor = (req: Request, res: Response, next: NextFunction) => {
//     const isInstructor = req.user?.accountType === 'instructor'
//     if(isInstructor) {
//         next()
//     } else {
//         next(new ExpressError(401, 'Not authorized, as Instructor'))
//     }
// };

export { protect, customRole };