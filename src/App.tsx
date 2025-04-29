import { useState } from "react";
import FlexibleShift from "./components/FlexibleShift";
import StandardShift from "./components/StandardShift";

const App = () => {
  const [isDurationBasedShift, setIsDurationBasedShift] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex justify-center pb-10">
      <div className="w-full px-4 md:px-0 max-w-2xl">
        <header className="flex items-center justify-between border-b border-b-[#ffffff90] py-4">
          <h1 className="text-2xl sm:text-3xl text-[#A563C1] font-bold">
            Shift Timer
          </h1>
          <label
            htmlFor="toggleDurationBasedShift"
            className="flex items-center gap-3 relative">
            Flexible shift
            <div
              className={`w-10 h-5 rounded-full bg- ${
                isDurationBasedShift ? "bg-[#A563C1]" : "bg-gray-500"
              } relative focus-within:outline focus-within:outline-1 focus-within:outline-offset-2 transition`}>
              <div
                className={`w-[calc(45%)] aspect-square bg-neutral-900 rounded-full absolute ${
                  isDurationBasedShift ? "translate-x-full" : ""
                } top-1/2 left-[5%] -translate-y-1/2 transition`}
              />
              <input
                type="checkbox"
                name="toggleDurationBasedShift"
                id="toggleDurationBasedShift"
                onChange={() => setIsDurationBasedShift((prev) => !prev)}
                className="sr-only"
              />
            </div>
          </label>
        </header>

        <StandardShift visible={!isDurationBasedShift} />
        <FlexibleShift visible={isDurationBasedShift} />
      </div>
    </div>
  );
};

export default App;
