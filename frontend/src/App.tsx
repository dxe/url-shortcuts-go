import React, { useEffect, useState } from "react";
import "./App.css";
import "bulma/css/bulma.min.css";
import { Navbar, Box, Menu, Columns } from "react-bulma-components";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ShortcutsPage } from "./components/Shortcuts/ShortcutsPage";
import { EditShortcutPage } from "./components/Shortcuts/EditShortcutPage";
import { VisitsPage } from "./components/Visits/VisitsPage";
import { User, UsersPage } from "./components/Users/UsersPage";
import { EditUserPage } from "./components/Users/EditUserPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMedal,
  faPlus,
  faToolbox,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const ROOT_PATH =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://dxe.io"; // TODO: use env?
export const API_PATH = ROOT_PATH + "/api";
export const AUTH_PATH = ROOT_PATH + "/auth";

export default function App() {
  const [navbarActive, setNavbarActive] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null as User | null);
  const currentRoute = useLocation();

  const getCurrentUser = async () => {
    try {
      const resp = await fetch(API_PATH + `/users/me`, {
        // method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
      });
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login";
        return;
      }
      const body = await resp.json();
      setLoggedInUser(body.user);
    } catch (e) {
      alert("Failed to get current user. Please try again.");
    }
  };

  useEffect(() => {
    // load shortcuts from api
    getCurrentUser();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="App">
      <Navbar colorVariant={"dark"} active={navbarActive}>
        <Navbar.Brand>
          <Navbar.Item href={"/shortcuts"}>
            <strong>DxE Shortcuts</strong>&nbsp;
            <small>
              <span style={{ color: "orange" }}>BETA</span>
            </small>
          </Navbar.Item>
          <Navbar.Burger onClick={() => setNavbarActive(!navbarActive)} />
        </Navbar.Brand>
        <Navbar.Menu>
          <Navbar.Container align="right">
            <Navbar.Item>{loggedInUser?.Name}</Navbar.Item>
            <Navbar.Item href={AUTH_PATH + "/logout"}>Log out</Navbar.Item>
          </Navbar.Container>
        </Navbar.Menu>
      </Navbar>

      <Columns className={"p-3"}>
        <Columns.Column size={"one-quarter"}>
          <Box>
            <Menu>
              <Menu.List title="Shortcuts">
                <Link to={"/new"} state={{ shortcut: null }}>
                  <Menu.List.Item active={currentRoute.pathname === "/new"}>
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ marginRight: 10 }}
                    />
                    New Shortcut
                  </Menu.List.Item>
                </Link>
                <Link to={"/"}>
                  <Menu.List.Item active={currentRoute.pathname === "/"}>
                    <FontAwesomeIcon
                      icon={faToolbox}
                      style={{ marginRight: 10 }}
                    />
                    Manage Shortcuts
                  </Menu.List.Item>
                </Link>
                <Link to={"/visits"}>
                  <Menu.List.Item active={currentRoute.pathname === "/visits"}>
                    <FontAwesomeIcon
                      icon={faMedal}
                      style={{ marginRight: 10 }}
                    />
                    View Top Shortcuts
                  </Menu.List.Item>
                </Link>
              </Menu.List>

              {loggedInUser?.Admin && (
                <Menu.List title="Administration">
                  <Link to={"/new_user"} state={{ user: null }}>
                    <Menu.List.Item
                      active={currentRoute.pathname === "/new_user"}
                    >
                      <FontAwesomeIcon
                        icon={faUserPlus}
                        style={{ marginRight: 10 }}
                      />
                      New User
                    </Menu.List.Item>
                  </Link>
                  <Link to={"/users"}>
                    <Menu.List.Item active={currentRoute.pathname === "/users"}>
                      <FontAwesomeIcon
                        icon={faUsers}
                        style={{ marginRight: 10 }}
                      />
                      Manage Users
                    </Menu.List.Item>
                  </Link>
                </Menu.List>
              )}
            </Menu>
          </Box>
        </Columns.Column>
        <Columns.Column>
          <Box>
            <Routes>
              <Route path="/" element={<ShortcutsPage />} />
              <Route path="/new" element={<EditShortcutPage />} />
              <Route path="/edit" element={<EditShortcutPage />} />
              <Route path="/visits" element={<VisitsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/new_user" element={<EditUserPage />} />
              <Route path="/edit_user" element={<EditUserPage />} />
            </Routes>
          </Box>
        </Columns.Column>
      </Columns>
    </div>
  );
}
