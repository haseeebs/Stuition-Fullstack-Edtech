import { Link } from "react-router-dom";

interface Button2Interface {
    to: string;
    children: React.ReactNode;
}

const Button2 = ({ to, children }: Button2Interface) => {
  return (
    <Link
      to={to}
      className="button-2 font-medium"
    >
      {children}
    </Link>
  );
};

export default Button2;
