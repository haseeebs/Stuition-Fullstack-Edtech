import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Button1Interface {
    to: string;
    children: ReactNode
}

const Button1 = ({ to, children }: Button1Interface) => {
  return (
    <Link
      to={to}
      className="button-1 font-medium"
    >
      {children}
    </Link>
  );
};

export default Button1;
