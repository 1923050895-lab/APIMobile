/**
 * Format số tiền VNĐ an toàn cho Hermes (React Native).
 * Hermes không hỗ trợ Number.prototype.toLocaleString('vi-VN'),
 * nên cần dùng hàm formatVND và polyfill Number.prototype.toLocaleString.
 */

export function formatVND(amount) {
    if (amount === undefined || amount === null || amount === '') return '0';
    const num = Number(amount);
    if (isNaN(num)) return '0';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Polyfill an toàn cho Number.prototype.toLocaleString trên Hermes (Android/iOS)
if (typeof Number.prototype.toLocaleString !== 'function') {
    Number.prototype.toLocaleString = function () {
        const num = Number(this || 0);
        if (isNaN(num)) return '0';
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };
}

export default formatVND;
