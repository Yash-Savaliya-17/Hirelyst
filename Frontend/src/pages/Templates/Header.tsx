import {Navbar} from '../index'
import {Outlet} from "react-router-dom"

const Header = () => {
    return (
        <div className="w-full h-[100vh] flex flex-col">
            <div className='w-full h-[10vh]'>
                <Navbar />
            </div>
            <div className="w-full h-[90vh]">
                <Outlet />
            </div>
        </div>
    )
}

export default Header;
