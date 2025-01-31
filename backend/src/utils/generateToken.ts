import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongoose';

const generateToken = (res: Response, userId: ObjectId) => {
    if (!process.env.JWT_SECRET_KEY) throw new Error('JWT_SECRET_KEY is not defined in the environment variables');

    const token = jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });

    res.cookie('jwtToken', token, {
        httpOnly: true, // So only backend can access
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
    });
};

export default generateToken;
