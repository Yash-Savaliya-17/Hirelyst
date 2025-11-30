import React from 'react'
import Navbar from "@/components/Navbar/Navbar.tsx";
import {Outlet} from "react-router-dom";

const BaseLayout = ({navbar = false}) => {
    return (
        <>
            {navbar &&
                <Navbar/>
            }
            <div className="pt-[80px] max-w-7xl mx-auto w-full">
                <Outlet/>
            </div>
        </>
    )
}
export default BaseLayout
