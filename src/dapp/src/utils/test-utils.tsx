import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { render, RenderOptions } from "@testing-library/react";
import { PropsWithChildren, ReactElement, useEffect } from "react";
import { MemoryRouter } from "react-router-dom";
import { RecoilRoot, RecoilValue, useRecoilValue } from "recoil";
import { voteCreationAtom } from "../features/vote-creation/state";

type RecoilObserverProps = {
  onChange: jest.Mock<any, any, any>;
  node: RecoilValue<unknown>;
};

const RecoilObserver = ({ node, onChange }: RecoilObserverProps) => {
  const value = useRecoilValue(node);
  useEffect(() => onChange && onChange(value), [onChange, value]);
  return null;
};

const Providers =
  (onRecoilChange = jest.fn()) =>
  ({ children }: PropsWithChildren) => {
    return (
      <RecoilRoot>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter>
            <RecoilObserver node={voteCreationAtom} onChange={onRecoilChange} />
            {children}
          </MemoryRouter>
        </LocalizationProvider>
      </RecoilRoot>
    );
  };

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper"> & { onRecoilChange?: jest.Mock<any, any, any> }) =>
  render(ui, { wrapper: Providers(options?.onRecoilChange), ...options });

export * from "@testing-library/react";
export { customRender as render };
