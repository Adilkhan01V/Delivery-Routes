import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

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
