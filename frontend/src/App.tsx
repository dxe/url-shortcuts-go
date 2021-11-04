import React, { useEffect, useState } from "react";
import "./App.css";
import "bulma/css/bulma.min.css";
import {
  Button,
  Navbar,
  Heading,
  Section,
  Box,
  Level,
  Form,
  Menu,
  Columns,
} from "react-bulma-components";
import { Routes, Route, Link } from "react-router-dom";

const ROOT_PATH =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://dxe.io"; // TODO: use env?
const API_PATH = ROOT_PATH + "/api";
const AUTH_PATH = ROOT_PATH + "/auth";

function App() {
  const [navbarActive, setNavbarActive] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  if (unauthorized) {
    return (
      <div className="login-page-wrapper">
        <a href={AUTH_PATH + "/login"}>Log in</a>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar colorVariant={"dark"} active={navbarActive}>
        <Navbar.Brand>
          <Navbar.Item href="#">
            <strong>DxE Shortcuts</strong>
          </Navbar.Item>
          <Navbar.Burger onClick={() => setNavbarActive(!navbarActive)} />
        </Navbar.Brand>
        <Navbar.Menu>
          <Navbar.Container align="right">
            <Navbar.Item href={AUTH_PATH + "/logout"}>Log out</Navbar.Item>
          </Navbar.Container>
        </Navbar.Menu>
      </Navbar>

      <Columns className={"p-3"}>
        <Columns.Column size={"one-quarter"}>
          <Box>
            <Menu>
              <Menu.List title="Shortcuts">
                {/*TODO: set active depending on route*/}
                <Menu.List.Item>New Shortcut</Menu.List.Item>
                <Link to={"/"}>
                  <Menu.List.Item active>Manage Shortcuts</Menu.List.Item>
                </Link>
                <Menu.List.Item>View Visits</Menu.List.Item>
              </Menu.List>

              <Menu.List title="Administration">
                <Link to={"/users"}>
                  <Menu.List.Item>Manage Users</Menu.List.Item>
                </Link>
              </Menu.List>
            </Menu>
          </Box>
        </Columns.Column>
        <Columns.Column>
          <Box>
            <Routes>
              <Route path="/" element={<ShortcutsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Routes>
          </Box>
        </Columns.Column>
      </Columns>
    </div>
  );
}

const ShortcutsPage = () => {
  const [shortcuts, setShortcuts] = useState([]);

  const getShortcutsList = async () => {
    try {
      const resp = await fetch(API_PATH + "/shortcuts", {
        // method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
      });
      if (resp.status === 401) {
        // TODO: consider just redirecting to the login page
        //window.location.href = AUTH_PATH + "/login"
        console.log("User is not authorized.");
        alert("User is not authorized.");
        //setUnauthorized(true)
        return;
      }
      const body = await resp.json();
      return body.shortcuts;
    } catch (e) {
      alert("Failed to load shortcuts. Please try again.");
    }
  };

  useEffect(() => {
    // load shortcuts from api
    (async () => {
      const shortcuts = await getShortcutsList();
      setShortcuts(shortcuts);
    })();
  }, []);

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5} subtitle>
              <strong>Shortcuts</strong>
            </Heading>
          </Level.Item>
        </Level.Side>
        <Level.Side align="right">
          <Level.Item>
            <Form.Field kind="addons">
              <Form.Control>
                <Form.Input placeholder="Find a shortcut" />
              </Form.Control>
              <Form.Control>
                <Button>Search</Button>
              </Form.Control>
            </Form.Field>
          </Level.Item>
        </Level.Side>
      </Level>

      {shortcuts &&
        shortcuts.map((s: any) => (
          <Box style={{ marginBottom: 10, border: 3, borderSpacing: "solid" }}>
            <Columns style={{ flexDirection: "row-reverse" }}>
              <Columns.Column>
                <Heading size={4}>
                  <span style={{ color: "grey" }}>dxe.io/</span>
                  {s.Code}
                </Heading>
                <Heading subtitle size={6}>
                  <a href={s.URL} target={"_blank"}>
                    {s.URL}
                  </a>
                </Heading>
              </Columns.Column>
              <Columns.Column narrow>
                {/*TODO: buttons should be side by side on mobile width*/}
                <Button className={"mb-1 is-fullwidth"}>Edit</Button>
                <Button color={"danger"} className={"mb-1 is-fullwidth"}>
                  Delete
                </Button>
              </Columns.Column>
            </Columns>
          </Box>
        ))}
    </>
  );
};

const UsersPage = () => <>Users</>;

export default App;
