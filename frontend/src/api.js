import axios from 'axios';

// Support VITE_API_URL env variable for production, fallback to localhost:8001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getDeliveries = async () => {
  const response = await api.get('/deliveries');
  return response.data;
};

export const optimizeRoute = async (deliveryIds = null) => {
  const payload = deliveryIds ? { delivery_ids: deliveryIds } : {};
  const response = await api.post('/optimize-route', payload);
  return response.data;
};

export const generateDeliveries = async (count = null) => {
  const payload = count ? { count: parseInt(count) } : {};
  const response = await api.post('/generate-deliveries', payload);
  return response.data;
};

export default api;
