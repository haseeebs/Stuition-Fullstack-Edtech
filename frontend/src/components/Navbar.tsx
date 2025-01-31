import { Link } from "react-router-dom";
import Button2 from "./Buttons/Button2";
import Button3 from "./Buttons/Button3";

const Navbar = () => {
  return (
    <nav className="bg-third text-fifth p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={'/'} className="hover-line text-4xl font-poppins font-bold text-purple-700">Stuition</Link>
        <div className="hidden md:flex space-x-2">
          <Button2 to="/login">Log In</Button2>
          <Button3 to="/register">Sign Up</Button3>
        </div>


        <button className="md:hidden p-2 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
