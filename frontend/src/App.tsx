import React, { useEffect, useState } from "react";
import "./App.css";
import "bulma/css/bulma.min.css";
import {
  Button,
  Navbar,
  Heading,
  Box,
  Level,
  Form,
  Menu,
  Columns,
  Pagination,
} from "react-bulma-components";
import {Routes, Route, Link, useLocation, useNavigate} from "react-router-dom";

const ROOT_PATH =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://dxe.io"; // TODO: use env?
const API_PATH = ROOT_PATH + "/api";
const AUTH_PATH = ROOT_PATH + "/auth";

function App() {
  const [navbarActive, setNavbarActive] = useState(false);
  const currentRoute = useLocation();

  return (
    <div className="App">
      <Navbar colorVariant={"dark"} active={navbarActive}>
        <Navbar.Brand>
          <Navbar.Item>
            <strong>DxE Shortcuts</strong>&nbsp;<small><span style={{color: "orange"}}>BETA</span></small>
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
                {/*TODO: decide best way to link to new/edit page or modal*/}
                <Link to={"/new"} state={{shortcut: null}}>
                  <Menu.List.Item active={currentRoute.pathname === "/new"}>
                    New Shortcut
                  </Menu.List.Item>
                </Link>
                <Link to={"/"}>
                  <Menu.List.Item active={currentRoute.pathname === "/"}>
                    Manage Shortcuts
                  </Menu.List.Item>
                </Link>
                {/*TODO*/}
                {/*<Link to={"/visits"}>*/}
                {/*  <Menu.List.Item active={currentRoute.pathname === "/visits"}>*/}
                {/*    View Visits*/}
                {/*  </Menu.List.Item>*/}
                {/*</Link>*/}
              </Menu.List>

              {/*TODO*/}
              {/*<Menu.List title="Administration">*/}
              {/*  /!*TODO: decide best way to link to new/edit page or modal*!/*/}
              {/*  <Link to={"/new_user"}>*/}
              {/*    <Menu.List.Item>New User</Menu.List.Item>*/}
              {/*  </Link>*/}
              {/*  <Link to={"/users"}>*/}
              {/*    <Menu.List.Item active={currentRoute.pathname === "/users"}>*/}
              {/*      Manage Users*/}
              {/*    </Menu.List.Item>*/}
              {/*  </Link>*/}
              {/*</Menu.List>*/}
            </Menu>
          </Box>
        </Columns.Column>
        <Columns.Column>
          <Box>
            <Routes>
              <Route path="/" element={<ShortcutsPage />} />
              <Route path="/new" element={<NewShortcutPage />} />
              <Route path="/edit" element={<EditShortcutPage />} />
              <Route path="visits" element={<VisitsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="new_user" element={<NewUserPage />} />
              <Route path="edit_user" element={<EditUserPage />} />
            </Routes>
          </Box>
        </Columns.Column>
      </Columns>
    </div>
  );
}

const ShortcutsPage = () => {
  const [initLoading, setInitLoading] = useState(true);
  const [shortcuts, setShortcuts] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 5;

  const getShortcuts = async (returnToFirstPage: boolean = false) => {
    try {
      // TODO: maybe just do the offset calculation on backend based on page and limit
      const resp = await fetch(
        API_PATH + `/shortcuts?limit=${limit}&page=${page}&code=${searchCode}`,
        {
          // method: 'GET', // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          credentials: "include", // include, *same-origin, omit
        }
      );
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login"
        return;
      }
      const body = await resp.json();
      setShortcuts(body.shortcuts);
      setTotal(body.total_count);
      if (returnToFirstPage) {
        setPage(1);
      }
    } catch (e) {
      alert("Failed to load shortcuts. Please try again.");
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    // load shortcuts from api
    getShortcuts();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const deleteShortcut = async (shortcut: any) => {
    const ok = window.confirm(`Are you sure you want to delete the shortcut: ${shortcut.Code}?`)
    if (ok) {
      try {
        const resp = await fetch(
          API_PATH + `/shortcuts/${shortcut.ID}`,
          {
            method: "DELETE",
            mode: "cors", // no-cors, *cors, same-origin
            credentials: "include", // include, *same-origin, omit
          }
        );
        if (resp.status !== 200) {
          const err = await resp.text()
          throw(err)
        }
        // success
        getShortcuts();
      } catch (e) {
        console.error(e)
        alert("Failed to delete shortcut.");
      }
    }
  }

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
                {/*TODO: refactor this to be cleaner*/}
                <Form.Input
                  placeholder="Find a shortcut"
                  type={"search"}
                  value={searchCode}
                  onChange={(evt) => setSearchCode(evt.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") getShortcuts(true);
                  }}
                />
              </Form.Control>
              <Form.Control>
                <Button
                  onClick={() => {
                    getShortcuts(true);
                  }}
                >
                  Search
                </Button>
              </Form.Control>
            </Form.Field>
          </Level.Item>
        </Level.Side>
      </Level>

      {!initLoading && shortcuts && shortcuts.length === 0 && (
        <Box>No shortcuts found.</Box>
      )}

      {shortcuts &&
        // TODO: use type
        shortcuts.map((s: any) => (
          <Box
            style={{ marginBottom: 10, border: 3, borderSpacing: "solid" }}
            key={s.ID}
          >
            <Columns style={{ flexDirection: "row-reverse" }}>
              <Columns.Column>
                {/*TODO: show a copy icon & display a toast after clicking it to say success or error */}
                <Heading
                  size={4}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    navigator.clipboard.writeText("https://dxe.io/" + s.Code);
                  }}
                >
                  <span style={{ color: "grey" }}>dxe.io/</span>
                  {s.Code}
                </Heading>
                <Heading subtitle size={6}>
                  <a href={s.URL} target={"_blank"} rel={"noreferrer"}>
                    {s.URL}
                  </a>
                </Heading>
              </Columns.Column>
              <Columns.Column narrow>
                {/*TODO: buttons should be side by side on mobile width*/}
                <Link to={"/edit"} state={{shortcut: s}} >
                  <Button className={"mb-1 is-fullwidth"}>Edit</Button>
                </Link>
                <Button color={"danger"} className={"mb-1 is-fullwidth"} onClick={() => deleteShortcut(s)}>
                  Delete
                </Button>
              </Columns.Column>
            </Columns>
          </Box>
        ))}

      <Pagination
        current={page}
        showFirstLast
        total={Math.ceil(total / limit)}
        onChange={(pageNum) => {
          setPage(pageNum);
        }}
        className={"pt-4"}
      />
    </>
  );
};

const ShortcutForm = (props: any) => {
  const [id, setID] = useState("");
  const [code, setCode] = useState("");
  const [target, setTarget] = useState("");
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (props?.shortcut) {
      setID(props.shortcut.ID)
      setCode(props.shortcut.Code)
      setTarget(props.shortcut.URL)
    }
  }, [props])

  const save = async () => {
    setSaving(true);

    // validate input fields
    if (code.length === 0) {
      alert("Short Link must not be blank!")
      return
    }
    if (code.indexOf(" ") !== -1) {
      alert("Short Link must not contain spaces!")
      return
    }
    if (target.substr(0,7) !== "http://" && target.substr(0,8) !== "https://") {
      alert(`Target URL must begin with "http://" or "https://" prefix.`)
      return
    }

    try {
      const resp = await fetch(
        API_PATH + `/shortcuts/${id}`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          method: props?.shortcut ? "PUT" : "POST",
          mode: "cors", // no-cors, *cors, same-origin
          credentials: "include", // include, *same-origin, omit
          body: JSON.stringify({code: code, url: target})
        }
      );
      if (resp.status !== 200) {
        const err = await resp.text()
        throw(err)
      }
      // success
      navigate("/")
    } catch (e) {
      console.error(e)
      alert("Failed to save shortcut. Maybe it already exists?");
      setSaving(false);
    }
  };

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5} subtitle>
              <strong>{props?.shortcut ? "Edit" : "New"} Shortcut</strong>
            </Heading>
          </Level.Item>
        </Level.Side>
      </Level>

      <Form.Field>
        <Form.Label>Short Link</Form.Label>
        <Form.Field kind="addons">
          <Form.Control>
            <Button disabled className={"is-large"}>
              dxe.io/
            </Button>
          </Form.Control>
          <Form.Control fullwidth>
            <Form.Input
              placeholder=""
              type="text"
              className={"is-large"}
              autoFocus
              value={code}
              onChange={(evt) => setCode(evt.target.value.toLowerCase())}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      <Form.Field>
        <Form.Label>Target URL</Form.Label>
        <Form.Field kind="addons">
          <Form.Control fullwidth>
            <Form.Input
              placeholder="https://"
              type="text"
              value={target}
              onChange={(evt) => setTarget(evt.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") save();;
              }}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      <Form.Field kind="group" className={"pt-4"}>
        <Form.Control>
          <Button color="link" onClick={save} disabled={saving}>
            Save
          </Button>
        </Form.Control>
        <Form.Control>
          <Link to={"/"}>
            <Button color="link" colorVariant="light">
              Cancel
            </Button>
          </Link>
        </Form.Control>
      </Form.Field>
    </>
  );
}

const NewShortcutPage = () => {
  return <ShortcutForm />
};

const EditShortcutPage = () => {
  const location = useLocation();
  const { shortcut } = location.state

  return <ShortcutForm shortcut={shortcut} />

};

const VisitsPage = () => <>Visits</>;

const UsersPage = () => <>Users</>;

const UserForm = () => <>Users</>;

const NewUserPage = () => <>Users</>;

const EditUserPage = () => <>Users</>;

export default App;
