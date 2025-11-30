import ReactDOM from 'react-dom/client'
import {router} from './App.tsx'
import './index.css'
import {RouterProvider} from "react-router-dom";
import {Provider} from "react-redux";
import store from "./slices/store.ts";
import {Toaster} from "sonner";
import {ThemeProvider} from './components/theme-provider.tsx';
import AuthInitializer from "@/pages/Templates/AuthInitializer.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode >
    <Provider store={store}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <AuthInitializer>
                <RouterProvider router={router}>
                </RouterProvider>
            </AuthInitializer>
        </ThemeProvider>
        <Toaster richColors className='font-manrope' position='top-center'/>
    </Provider>
    // </React.StrictMode>,
)
