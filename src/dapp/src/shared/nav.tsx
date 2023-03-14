import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="bg-white px-2 sm:px-4 py-2.5 dark:bg-gray-900 fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-600">
      <div className="container flex flex-wrap justify-between items-center mx-auto">
        <Link to="/" className="flex items-center">
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Algorand Voting Tool</span>
        </Link>
        <div className="flex md:order-2">
          <Link to="/config">Vote Creator</Link>
        </div>
      </div>
    </nav>
  );
}
