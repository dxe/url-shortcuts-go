import React, {useEffect, useState} from 'react';
import './App.css';
import 'bulma/css/bulma.min.css';
import { Button } from 'react-bulma-components';

// TODO: move to env
//const ROOT_PATH = "http://localhost:8080"
const ROOT_PATH = "https://shortcuts.dxe.io"

const getShortcutsList = async () => {
    try {
        const resp = await fetch(ROOT_PATH + "/api/shortcuts/list")
        return resp.json()
    }
    catch(e) {
        console.error("Failed to load shortcuts.")
    }
}

function App() {
  const [shortcuts, setShortcuts] = useState([]);

  useEffect(() => {
    (async () => {
      const shortcuts = await getShortcutsList()
      setShortcuts(shortcuts)
    })()
  }, [])

  return (
    <div className="main">
      <a href={ ROOT_PATH + "/login" }><Button color="primary">Log in</Button></a>
      <a href={ ROOT_PATH + "/logout" }><Button color="primary">Log out</Button></a>
      <p>{
        shortcuts && shortcuts.map((s: any) => {
          return <p>{s.Code} | {s.URL}</p>
        })
      }
      </p>
    </div>
  );
}

export default App;
