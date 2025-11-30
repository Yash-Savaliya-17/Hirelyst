import {Inject, Injectable} from "@nestjs/common";
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";

interface AxiosModuleOptions {
    baseURL: string;
}

@Injectable()
export class AxiosService {
    private readonly axiosInstance: AxiosInstance;

    constructor(@Inject('AXIOS_OPTIONS') private readonly options: AxiosModuleOptions) {
        this.axiosInstance = axios.create({
            baseURL: options.baseURL,
        });
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.get<T>(url, config);
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.post<T>(url, data, config);
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.put<T>(url, data, config);
    }
}