import axios, { AxiosInstance } from 'axios';

export class HTTPClient {
  private client: AxiosInstance;

  constructor(baseURL: string, timeout: number = 10000) {
    this.client = axios.create({
      baseURL,
      timeout,
    });
  }

  async get<T>(url: string, token?: string): Promise<T> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await this.client.get<T>(url, config);
    return data;
  }

  async post<T>(url: string, payload: any, token?: string): Promise<T> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await this.client.post<T>(url, payload, config);
    return data;
  }

  async patch<T>(url: string, payload: any, token?: string): Promise<T> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await this.client.patch<T>(url, payload, config);
    return data;
  }

  async download(url: string, token?: string): Promise<Buffer> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await this.client.get(url, { ...config, responseType: 'arraybuffer' });
    return Buffer.from(data);
  }
}

// Service clients
export const geoClient = new HTTPClient(process.env.GEOFENCE_API_URL || 'http://localhost:5001');
export const employeeClient = new HTTPClient(process.env.EMPLOYEE_API_URL || 'http://localhost:5002');
export const payslipsClient = new HTTPClient(process.env.PAYSLIPS_API_URL || 'http://localhost:5003');
export const ragPipelineClient = new HTTPClient(process.env.RAG_PIPELINE_API_URL || 'http://localhost:5004');
export const mobileAppClient = new HTTPClient(process.env.MOBILE_APP_API_URL || 'http://localhost:3000');
