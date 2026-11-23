import { getStoreSettings } from "@/lib/store";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const { logoUrl } = await getStoreSettings();
  return <NavbarClient logoUrl={logoUrl} />;
}
