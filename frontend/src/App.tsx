import React, { useEffect, useState } from "react";
import "./App.css";
import "bulma/css/bulma.min.css";
import { Navbar, Box, Menu, Columns } from "react-bulma-components";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Shortcut, ShortcutsPage } from "./components/Shortcuts/ShortcutsPage";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

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
      const resp = await axios.get(API_PATH + `/me`, { withCredentials: true });
      setLoggedInUser(resp.data.user);
    } catch (e: any) {
      if (e.response.status === 401) {
        window.location.href = AUTH_PATH + "/login";
      }
      toast.error("Failed to get logged in user: " + e.response.data);
    }
  };

  useEffect(() => {
    // load shortcuts from api
    getCurrentUser();
  }, []);

  return (
    <div className="App">
      <Navbar colorVariant={"dark"} active={navbarActive}>
        <Navbar.Brand>
          <Navbar.Item style={{ cursor: "default" }}>
            <strong>DxE Shortcuts</strong>
          </Navbar.Item>
          <Navbar.Burger onClick={() => setNavbarActive(!navbarActive)} />
        </Navbar.Brand>
        <Navbar.Menu>
          <Navbar.Container align="right">
            <Navbar.Item style={{ cursor: "default" }}>
              {loggedInUser?.Name}
            </Navbar.Item>
            <Navbar.Item href={AUTH_PATH + "/logout"}>Log out</Navbar.Item>
          </Navbar.Container>
        </Navbar.Menu>
      </Navbar>

      <Columns className={"p-3"}>
        <Columns.Column size={"one-quarter"}>
          <Box>
            <Menu>
              <Menu.List title="Shortcuts">
                <Link
                  to={"/new"}
                  state={{ shortcut: new Shortcut() }}
                  className={
                    currentRoute.pathname === "/new" ? "is-active" : ""
                  }
                >
                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: 10 }} />
                  New Shortcut
                </Link>
                <Link
                  to={"/"}
                  className={currentRoute.pathname === "/" ? "is-active" : ""}
                >
                  <FontAwesomeIcon
                    icon={faToolbox}
                    style={{ marginRight: 10 }}
                  />
                  Manage Shortcuts
                </Link>
                <Link
                  to={"/visits"}
                  className={
                    currentRoute.pathname === "/visits" ? "is-active" : ""
                  }
                >
                  <FontAwesomeIcon icon={faMedal} style={{ marginRight: 10 }} />
                  View Top Shortcuts
                </Link>
              </Menu.List>

              {loggedInUser?.Admin && (
                <Menu.List title="Administration">
                  <Link
                    to={"/new_user"}
                    state={{ user: new User() }}
                    className={
                      currentRoute.pathname === "/new_user" ? "is-active" : ""
                    }
                  >
                    <FontAwesomeIcon
                      icon={faUserPlus}
                      style={{ marginRight: 10 }}
                    />
                    New User
                  </Link>
                  <Link
                    to={"/users"}
                    className={
                      currentRoute.pathname === "/users" ? "is-active" : ""
                    }
                  >
                    <FontAwesomeIcon
                      icon={faUsers}
                      style={{ marginRight: 10 }}
                    />
                    Manage Users
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
      <ToastContainer
        position={"bottom-left"}
        autoClose={3000}
        newestOnTop={true}
      />
    </div>
  );
}
