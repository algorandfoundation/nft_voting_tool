import { Outlet } from "react-router-dom";

export default function Root() {
  return (
    <div className="mt-16">
      <Outlet />
    </div>
  );
}
