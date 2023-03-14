import clsx from "clsx";
import { Link } from "react-router-dom";

const polygonClipPath = "polygon(calc(2rem) 0, 100% 0, 100% calc(100% - 2rem), calc(100% - 2rem) 100%, 0 100%, 0 calc(2rem))";

function HomePage() {
  const style = {
    clipPath: polygonClipPath,
  };
  return (
    <div className="bg-algorand-coal p-[2px] max-w-screen-xl mx-auto" style={style}>
      <div className={clsx("bg-white", "py-8", "px-4", "min-h-full", "min-w-full", "flex", "justify-between")} style={style}>
        <h3 className="font-bold my-auto flex-3 pl-8">Algorand council&nbsp;-&nbsp;Open until 21st March</h3>
        <Link
          className="shadow button bg-algorand-arctic-lime hover:bg-algorand-orange-coral focus:shadow-outline focus:outline-none hover:text-white font-bold pt-3 px-4 rounded-full"
          to="/cast/algo-council"
        >
          Cast my vote
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
