// The app chrome every gated screen renders inside — wireframes.dsl draws a
// brand-only `navbar "Rudeness Checker"` on both screens and no `sidebar`, so
// this shell is the sample app's shape (Header in AppShell.Navbar,
// AppShell.Main, Footer) with no navigation rail: there is nothing to put in
// one — the only way between the two screens is the flow's own buttons.
import type { ReactElement } from "react";
import { Outlet } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Footer,
  UserMenu,
  Box,
  version as OXYGEN_UI_VERSION,
} from "@wso2/oxygen-ui";
import { LogOut, WSO2 } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";

export function AppShell(): ReactElement {
  const { username } = useAuthz();

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header minimal>
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email="" />
              <UserMenu.Divider />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>
            © {new Date().getFullYear()} |{" "}
            <Box sx={{ verticalAlign: "middle", mx: 0.5, display: "inline-block" }}>
              <WSO2 size={12} />
            </Box>
            WSO2 LLC.
          </Footer.Copyright>
          <Footer.Divider />
          <Footer.Version>oxygen-ui-v{OXYGEN_UI_VERSION}</Footer.Version>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
