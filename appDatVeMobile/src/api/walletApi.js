import apiClient from './apiClient';

export const walletApi = {
    getBalance: () => {
        return apiClient.get('/wallet/balance');
    },

    getTransactions: () => {
        return apiClient.get('/wallet/transactions');
    },

    createDepositRequest: (amount, transferContent, bankName = 'VietComBank') => {
        return apiClient.post('/wallet/deposit-request', {
            SoTien: amount,
            NoiDungChuyenKhoan: transferContent,
            NganHang: bankName
        });
    },

    getMyDepositRequests: () => {
        return apiClient.get('/wallet/my-deposit-requests');
    }
};
