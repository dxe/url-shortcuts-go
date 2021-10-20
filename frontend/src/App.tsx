import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';

// TODO: move to env
//const ROOT_PATH = "http://localhost:8080"
const ROOT_PATH = "https://shortcuts.dxe.io"

const getShortcutsList = async () => {
  console.log("hello")
  const resp = await fetch(ROOT_PATH + "/api/shortcuts/list")
  console.log(resp)
  const body = await resp.json()
  console.log(body)
  return body
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
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p><a href={ ROOT_PATH + "/login" }>Log in</a></p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>{
          shortcuts && shortcuts.map((s: any) => {
            return <p>{s.Code} | {s.URL}</p>
          })
        }
        </p>
      </header>
    </div>
  );
}

export default App;
