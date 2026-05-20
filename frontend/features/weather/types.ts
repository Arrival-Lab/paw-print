export type WeatherTrigger =
  | 'HEATWAVE'
  | 'COLDWAVE'
  | 'RAIN_HEAVY'
  | 'DUST_PM'
  | 'YELLOW_DUST'
  | 'THUNDER'
  | 'RAIN_LIGHT'
  | 'TEMP_DIFF'
  | 'HUMIDITY_HIGH'
  | 'HUMIDITY_LOW'
  | 'UV_HIGH'
  | 'WIND_STRONG'
  | 'NONE';

export interface WeatherSnapshot {
  tempC: number | null;
  feelsLikeC: number | null;
  rainMmHourly: number | null;
  rainMmDaily: number | null;
  humidity: number | null;
  windMs: number | null;
  pm25: number | null;
  pm10: number | null;
  uvIndex: number | null;
  tempDiffC: number | null;
  yellowDustAlert: boolean | null;
  thunderAlert: boolean | null;
}

export interface WeatherTipResponse {
  trigger: WeatherTrigger;
  label: string;
  weather: WeatherSnapshot;
}
