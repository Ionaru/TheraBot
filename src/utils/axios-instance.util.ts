import { HttpsAgent } from 'agentkeepalive';
import axios, { AxiosInstance } from 'axios';

import { debug } from '../debug';

let axiosInstance: AxiosInstance;

export const getAxiosInstance = (): AxiosInstance => {
    if (!axiosInstance) {
        debug('Creating AxiosInstance');
        axiosInstance = axios.create({
            // keepAlive pools and reuses TCP connections, so it's faster
            httpsAgent: new HttpsAgent(),

            // Cap the maximum content length we'll accept to 50MBs, just in case
            maxContentLength: 50_000_000,

            // Follow up to 10 HTTP 3xx redirects
            maxRedirects: 10,

            // 60 sec timeout
            timeout: 60_000,
        });
    }

    return axiosInstance;
};
