import algorandLogo from "../assets/algorand-foundation-logo-white.svg";

interface Link {
  name: string;
  href: string;
}

function NavLink(props: { link: Link }) {
  return (
    <a href={props.link.href} className="px-4 break-words no-underline text-white" target="_blank">
      {props.link.name}
    </a>
  );
}

const links: Link[] = [
  { name: "Algorand Community", href: "https://community.algorand.org/" },
  { name: "Developer Resources", href: "https://developer.algorand.org/" },
  { name: "FAQs", href: "https://algorand.foundation/faq" },
  {
    name: "Disclaimers",
    href: "https://algorand.foundation/terms-and-conditions-and-important-disclaimers-of-algo-token-incentives",
  },
  {
    name: "Privacy Policies",
    href: "https://algorandfoundationv2.cdn.prismic.io/algorandfoundationv2/120c23ac-cc63-4c42-a10e-a53169fa4134_AF_Privacy_Policy.pdf",
  },
  { name: "Contact Us", href: "https://algorand.foundation/contact" },
  { name: "Algorand Inc.", href: "https://www.algorand.com/" },
];
export default function SiteFooter() {
  return (
    <div className="bg-black text-white text-base font-semibold pt-16 pb-16">
      <div className={"flex justify-center gap-3"}>
        <img className="p-[10px]" src={algorandLogo} alt="Algorand Foundation logo" />
        <div className="hidden lg:flex my-auto">
          {links.map((link, index) => (
            <NavLink key={index} link={link} />
          ))}
        </div>
      </div>
    </div>
  );
}
