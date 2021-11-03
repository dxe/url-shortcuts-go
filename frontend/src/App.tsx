import React, {useEffect, useState} from 'react';
import './App.css';
import 'bulma/css/bulma.min.css';
import {Button, Navbar, Heading, Section, Box, Level, Form} from 'react-bulma-components';

// TODO: move to env
const ROOT_PATH = "https://dxe.io"
const API_PATH = ROOT_PATH + "/api"
const AUTH_PATH = ROOT_PATH + "/auth"

function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [navbarActive, setNavbarActive] = useState(false);

  const getShortcutsList = async () => {
    try {
      const resp = await fetch(API_PATH + "/shortcuts", {
        // method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        credentials: 'include', // include, *same-origin, omit
      })
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login"
        return
      }
      return await resp.json()
    }
    catch(e) {
      alert("Failed to load shortcuts. Please try again.")
    }
  }

  useEffect(() => {
    // load shortcuts from api
    (async () => {
      const shortcuts = await getShortcutsList()
      setShortcuts(shortcuts)
    })()
  }, [])

  return (
    <div className="page-wrapper">

      <Navbar colorVariant={"dark"} active={navbarActive}>
          <Navbar.Brand>
              <Navbar.Item href="#">
                  <strong>DxE Shortcuts</strong>
              </Navbar.Item>
              <Navbar.Burger onClick={() => setNavbarActive(!navbarActive)}/>
          </Navbar.Brand>
          <Navbar.Menu>
              <Navbar.Container>
                  <Navbar.Item href="#">
                      Shortcuts
                  </Navbar.Item>
                  <Navbar.Item href="#">
                      Visits
                  </Navbar.Item>
                  <Navbar.Item href="#">
                      Users
                  </Navbar.Item>
              </Navbar.Container>
              <Navbar.Container align="right">
                  <Navbar.Item href={ AUTH_PATH + "/logout" }>
                      Log out
                  </Navbar.Item>
              </Navbar.Container>
          </Navbar.Menu>
      </Navbar>

      <Section>

        <Box>
          <Level>
            <Level.Side>
              <Level.Item>
                <Heading
                  size={5}
                  subtitle
                >
                  <strong>
                    Shortcuts
                  </strong>
                </Heading>
              </Level.Item>
              <Level.Item>
                <Form.Field kind="addons">
                  <Form.Control>
                    <Form.Input placeholder="Find a shortcut" />
                  </Form.Control>
                  <Form.Control>
                    <Button>
                      Search
                    </Button>
                  </Form.Control>
                </Form.Field>
              </Level.Item>
            </Level.Side>
            <Level.Side align="right">
              <Level.Item>
                <Button
                  color="success"
                  renderAs="a"
                >
                  New
                </Button>
              </Level.Item>
            </Level.Side>
          </Level>

        </Box>

      </Section>

      <Section>
        {
          shortcuts && shortcuts.map((s: any) => (
            <Box style={{ maxWidth: 600, margin: 'auto', marginBottom: 10 }}>
              <Heading size={4}>{s.Code}</Heading>
              <Heading subtitle size={6}>{s.URL}</Heading>
              <Button color="">
                Edit
              </Button>
            </Box>
          ))
        }
      </Section>

    </div>
  );
}

export default App;
