import React, {useEffect, useState} from 'react';
import './App.css';
import 'bulma/css/bulma.min.css';
import {Button, Navbar, Heading, Section, Card, Content, Box} from 'react-bulma-components';

// TODO: move to env
const ROOT_API_PATH = "http://localhost:8080"
//const ROOT_API_PATH = "https://shortcuts.dxe.io"

function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [navbarActive, setNavbarActive] = useState(false);
  const [apiError, setApiError] = useState(false)

  const getShortcutsList = async () => {
    try {
      const resp = await fetch(ROOT_API_PATH + "/api/shortcuts/list", {
        // method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        credentials: 'include', // include, *same-origin, omit
      })
      return await resp.json()
    }
    catch(e) {
      console.error("Failed to load shortcuts.")
      // TODO: only show login button if status code is 4xx
      setApiError(true)
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
                  <Navbar.Item href={ ROOT_API_PATH + "/logout" }>
                      Log out
                  </Navbar.Item>
              </Navbar.Container>
          </Navbar.Menu>
      </Navbar>

      {apiError ? (<Section><a href={ ROOT_API_PATH + "/login" }><Button color="primary">Log in</Button></a></Section>)

        : (
          <div>
            <Section>
              <Heading>
                Shortcuts
              </Heading>
              <Button color="">
                Add new shortcut
              </Button>
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
        )

      }

    </div>
  );
}

export default App;
