import { getStoreSettings } from "@/lib/store";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const { logoUrl, brandName } = await getStoreSettings();
  return <NavbarClient logoUrl={logoUrl} brandName={brandName} />;
}
