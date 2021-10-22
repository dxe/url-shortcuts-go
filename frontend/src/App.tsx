import React, {useEffect, useState} from 'react';
import './App.css';
import 'bulma/css/bulma.min.css';
import {Button, Navbar} from 'react-bulma-components';

// TODO: move to env
const ROOT_API_PATH = "http://localhost:8080"
//const ROOT_API_PATH = "https://shortcuts.dxe.io"

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
    }
}

function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [navbarActive, setNavbarActive] = useState(false);

  useEffect(() => {
    // load shortcuts from api
    (async () => {
      const shortcuts = await getShortcutsList()
      setShortcuts(shortcuts)
    })()
  }, [])

  return (
    <div className="main">


        <Navbar active={navbarActive}>
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

      <a href={ ROOT_API_PATH + "/login" }><Button color="primary">Log in</Button></a>

      <div>
      {
        shortcuts && shortcuts.map((s: any) => {
          return <p>{s.Code} | {s.URL}</p>
        })
      }
      </div>

    </div>
  );
}

export default App;
