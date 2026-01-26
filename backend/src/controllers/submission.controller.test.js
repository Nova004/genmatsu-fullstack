// Mock DB to prevent connection attempt
jest.mock('../db', () => ({
    sql: {},
    poolConnect: Promise.resolve({}),
}));

const submissionController = require('./submission.controller');
const submissionService = require('../services/submission.service');
const pdfService = require('../services/pdf.service');

// Mock Dependencies
jest.mock('../services/submission.service');
jest.mock('../services/pdf.service');

const mockRequest = (body = {}, params = {}, user = null) => ({
    body,
    params,
    user,
    io: { emit: jest.fn() }
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Submission Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSubmission', () => {
        test('should return 400 if required fields are missing', async () => {
            const req = mockRequest({}); // Empty body
            const res = mockResponse();

            await submissionController.createSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Missing required fields." }));
        });

        test('should return 409 if Lot No is duplicate', async () => {
            const req = mockRequest({
                formType: 'GEN-A', lotNo: 'DUP001', templateIds: [1], formData: {}
            });
            const res = mockResponse();

            submissionService.checkLotNoExists.mockResolvedValue(true); // Mock duplicate found

            await submissionController.createSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ errorCode: "DUPLICATE_LOT" }));
        });

        test('should return 201 on success', async () => {
            const req = mockRequest({
                formType: 'GEN-A', lotNo: 'NEW001', templateIds: [1], formData: {}
            }, {}, { id: 'user1' });
            const res = mockResponse();

            submissionService.checkLotNoExists.mockResolvedValue(false);
            submissionService.createSubmission.mockResolvedValue(123); // Mock created ID

            await submissionController.createSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ submissionId: 123 }));
            expect(req.io.emit).toHaveBeenCalledWith("server-action", expect.objectContaining({ action: "refresh_data" }));
        });
    });

    describe('deleteSubmission', () => {
        test('should return 404 if submission not found (service returns false)', async () => {
            const req = mockRequest({}, { id: 999 });
            const res = mockResponse();

            submissionService.deleteSubmission.mockResolvedValue(false);

            await submissionController.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 200 on successful deletion', async () => {
            const req = mockRequest({}, { id: 100 }, { id: 'admin' });
            const res = mockResponse();

            submissionService.deleteSubmission.mockResolvedValue(true);

            await submissionController.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(submissionService.deleteSubmission).toHaveBeenCalledWith(100, 'admin');
        });
    });

    describe('updateSubmission', () => {
        test('should return 400 if missing body fields', async () => {
            const req = mockRequest({}, { id: 1 });
            const res = mockResponse();

            await submissionController.updateSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 200 on success', async () => {
            const req = mockRequest({ lot_no: 'L1', form_data: {} }, { id: 1 }, { id: 'u1' });
            const res = mockResponse();

            submissionService.updateSubmission.mockResolvedValue(true);

            await submissionController.updateSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(submissionService.updateSubmission).toHaveBeenCalledWith(1, 'L1', {}, 'u1');
        });
    });

});
