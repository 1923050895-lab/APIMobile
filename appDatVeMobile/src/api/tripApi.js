import apiClient from './apiClient';

export const tripApi = {
    getLocations: () => {
        return apiClient.get('/locations');
    },

    searchTrips: (departureId, destinationId, travelDate, timeSlot) => {
        const params = {};
        if (typeof departureId === 'object' && departureId !== null && !Array.isArray(departureId)) {
            Object.assign(params, departureId);
        } else {
            if (departureId) params.diem_di = departureId;
            if (destinationId) params.diem_den = destinationId;
            if (travelDate) params.ngay_di = travelDate;
            if (timeSlot) params.khung_gio = timeSlot;
        }
        return apiClient.get('/trips/search', { params });
    },

    getTripSeats: (tripId) => {
        return apiClient.get(`/trips/${tripId}/seats`);
    }
};
