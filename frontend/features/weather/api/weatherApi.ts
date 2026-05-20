import client from '../../../shared/api/client';
import type { WeatherTipResponse } from '../types';

export const weatherApi = {
  getCareTip: (lat: number, lng: number) =>
    client.get<WeatherTipResponse>('/api/weather/care-tip', { params: { lat, lng } }),
};
