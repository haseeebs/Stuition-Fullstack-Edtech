import { Link } from "react-router-dom";

interface Button3Interface {
    to: string;
    children: React.ReactNode;
}

const Button3 = ({ to, children }: Button3Interface) => {
  return (
    <Link
      to={to}
      className="button-3 font-medium"
    >
      {children}
    </Link>
  );
};

export default Button3;
