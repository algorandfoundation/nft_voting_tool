import clsx from "clsx";

const polygonClipPath = "polygon(calc(2rem) 0, 100% 0, 100% calc(100% - 2rem), calc(100% - 2rem) 100%, 0 100%, 0 calc(2rem))";

function CastVote() {
  const style = {
    clipPath: polygonClipPath,
  };
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <h2>Algorand council</h2>
          <p>Vote description is here.Vote description is here. Vote description is here. Vote description is here.</p>
          <p>
            <a href="/" className="no-underline hover:underline text-blue-600">
              Learn about the candidates
            </a>
          </p>
          <h3 className="mt-4">How to vote</h3>
          <p>
            This voting round is restricted to wallets on the&nbsp;
            <a href="/" className="no-underline hover:underline text-blue-600">
              allow list
            </a>
            .
          </p>
          <h3 className="mt-4">Who should be on the council?</h3>
          <div className="grid grid-cols-6 gap-4">
            <div>
              <p className="text-grey">Question</p>
            </div>
            <div className="col-span-5">
              <p>Who should be on the council?</p>
            </div>
            <div>
              <p className="text-grey">Description</p>
            </div>
            <div className="col-span-5">
              <p>Select the best candidate!</p>
            </div>
            <div>
              <p className="text-grey">Options</p>
            </div>
            <div className="col-span-5">
              <div className="p-4 mb-2 w-1/4 bg-green-200 hover:bg-green-700 hover:text-white cursor-pointer">Bob</div>
              <div className="p-4 mb-2 w-1/4 bg-green-200 hover:bg-green-700 hover:text-white cursor-pointer">Susie</div>
              <div className="p-4 mb-2 w-1/4 bg-green-200 hover:bg-green-700 hover:text-white cursor-pointer">Alice</div>
              <div className="p-4 mb-2 w-1/4 bg-green-200 hover:bg-green-700 hover:text-white cursor-pointer">Steve</div>
              <div className="mt-2">
                <button
                  className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
                  type="button"
                >
                  Cast my vote
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="bg-algorand-coal p-[2px] max-w-screen-xl mx-auto" style={style}>
            <div className={clsx("bg-white", "py-8", "px-4", "min-h-full", "min-w-full", "flex", "justify-between")} style={style}>
              <div className="grid grid-cols-1">
                <div>
                  <h3 className="block my-auto flex-3 pl-8">From</h3>
                  <h3 className="block my-auto flex-3 pl-8">10th March 2023 00:00 GMT (UTC +0)</h3>
                  <h3 className="block my-auto flex-3 pl-8">&nbsp;</h3>
                  <h3 className="block my-auto flex-3 pl-8">Until</h3>
                  <h3 className="block my-auto flex-3 pl-8">21st March 2023 00:00 GMT (UTC +0)</h3>
                </div>
              </div>
            </div>
          </div>
          <p>
            <a href="/" className="no-underline hover:underline text-blue-600">
              Link to Smart Contract
            </a>
          </p>
          <p>
            <a href="/" className="no-underline hover:underline text-blue-600">
              Link to IPFS
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default CastVote;
