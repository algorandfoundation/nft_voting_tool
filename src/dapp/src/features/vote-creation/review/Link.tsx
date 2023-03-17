type LinkProps = {
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
  label: string;
};
export const Link = ({ onClick, label }: LinkProps) => (
  <a className="uppercase text-sm text-blue-600 hover:text-blue-800" href="#" onClick={onClick}>
    {label}
  </a>
);
