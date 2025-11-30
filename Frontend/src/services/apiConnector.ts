import axios from "axios";

export const axiosInstance = axios.create()

export const apiConnector = async (method: string, url: string, bodyData?: any, headers?: any, params?: any, token?: string) => {
    return await axiosInstance({
        url: `${url}`,
        method: `${method}`,
        data: bodyData ? bodyData : null,
        headers: {
            ...headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        params: params ? params : null,
        withCredentials: true
    })
}
