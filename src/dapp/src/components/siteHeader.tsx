import { Disclosure, Popover } from "@headlessui/react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import algorandFoundationLogo from "../assets/algorand-foundation-logo.svg";
import { MenuIcon, XIcon } from "./icons";

interface Link {
  name: string;
  href: string;
  target?: string;
  subItems?: Link[];
  logo?: string;
}

const createNavigation = () =>
  [
    { name: "Home", href: "/" },
    { name: "Create", href: "/create" },
  ] as Link[];

function NavLink(props: { currentClasses: string; defaultClasses: string; link: Link; displayName?: string }) {
  return (
    <>
      {!props.link.href ? (
        <></>
      ) : props.link.href.match(/^https?:\/\//) ? (
        <a href={props.link.href} className={props.defaultClasses} target={props.link.target}>
          {props.link.name}
        </a>
      ) : (
        <Link to={props.link.href} className={props.defaultClasses}>
          {props.link.logo && <img src={props.link.logo} height="24px" width="24px" className="mr-1 inline-block" />}
          {props.displayName ?? props.link.name}
        </Link>
      )}
    </>
  );
}

export default function SiteHeader() {
  const navigation = createNavigation();

  return (
    <Disclosure as="nav" className="border-b border-solid border-grey-light shadow-sm shadow-grey-light">
      {({ open }) => (
        <div>
          {/*Header Content*/}
          <div className="flex justify-between lg:justify-start px-6">
            {/*Site Icon + Name */}
            <div className="py-4 lg:border-r-[0.5px] lg:border-black lg:border-solid pr-6">
              <Link to="/" className="my-auto cursor-pointer">
                <div className={clsx("flex")}>
                  <img className="h-[73px] w-auto my-auto" src={algorandFoundationLogo} alt="Algorand Foundation logo" />
                </div>
              </Link>
            </div>
            <div className="flex flex-1 justify-between">
              {/* Desktop Header */}
              <div className="hidden lg:flex lg:flex-row lg:justify-between ml-5 flex-auto">
                {/*Site Links*/}
                <Popover.Group as="nav" className="hidden lg:flex gap-[14px] cursor-pointer">
                  {navigation
                    .filter((nl) => nl.name)
                    .flatMap((link, index) => {
                      const navLink = (
                        <NavLink
                          key={index}
                          link={link}
                          defaultClasses="inline-flex items-center font-[600] text-l"
                          currentClasses="inline-flex items-center font-[600] text-l underline decoration-orange-600 underline-offset-[6px]"
                        />
                      );
                      const pipe = (
                        <div key={`${index}-pipe`} className="inline-flex items-center font-medium text-lg">
                          |
                        </div>
                      );
                      if (index === 0) return [navLink];
                      return [pipe, navLink];
                    })}
                </Popover.Group>
              </div>

              <span className="flex-auto block"></span>
              {/* Mobile Menu Open/Close */}
              <div className="lg:hidden -mr-2 flex items-center">
                <Disclosure.Button className="p-2">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>
          {/*Mobile Site Links*/}
          <Disclosure.Panel className="lg:hidden">
            <div className="pt-2">
              {navigation.map((link, index) => (
                <Disclosure.Button as="span" key={index}>
                  <NavLink
                    link={link}
                    defaultClasses="hover:bg-grey-light hover:border-grey hover:text-black block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                    currentClasses="bg-primary-light border-primary block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  />
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}
