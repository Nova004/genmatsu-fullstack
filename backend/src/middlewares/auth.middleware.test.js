const { verifyToken } = require('./auth.middleware');
const jwt = require('jsonwebtoken');

// Mock request/response objects
const mockRequest = () => {
    const req = {};
    req.header = jest.fn().mockReturnValue(null);
    return req;
};

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 401 if no token provided', () => {
        const req = mockRequest();
        const res = mockResponse();
        verifyToken(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "No token, authorization denied" });
    });

    test('should call next() if token is valid', () => {
        const req = mockRequest();
        const res = mockResponse();
        const token = jwt.sign({ user: { id: 1 } }, process.env.JWT_SECRET || 'default_secret');

        req.header.mockReturnValue(`Bearer ${token}`);

        verifyToken(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(1);
    });

    test('should return 401 if token is invalid', () => {
        const req = mockRequest();
        const res = mockResponse();

        req.header.mockReturnValue('Bearer invalid_token');

        verifyToken(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token is not valid" });
    });
});
