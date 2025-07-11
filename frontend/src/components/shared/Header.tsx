import { useAuth } from "../../contexts/AuthContext";
import { FiLogOut } from "react-icons/fi";

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">MoneyMind</h1>
        <button
          onClick={logout}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiLogOut className="mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;