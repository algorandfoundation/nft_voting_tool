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
          className="bg-algorand-arctic-lime uppercase font-beni text-4xl p-7 mr-8 ml-4 whitespace-nowrap text-black my-auto"
          to="/cast/algo-council"
        >
          Cast my vote
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
