import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Columns,
  Form,
  Heading,
  Level,
  Pagination,
} from "react-bulma-components";
import { Link } from "react-router-dom";
import { API_PATH, AUTH_PATH } from "../../App";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPencilAlt,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

export interface Shortcut {
  ID: number;
  Code: string;
  URL: string;
  CreatedAt: string;
  CreatedBy: number;
  UpdatedAt: string;
  UpdatedBy: number;
  TotalVisits: number; // only used for reporting, not always populated
}

export const ShortcutsPage = () => {
  const [initLoading, setInitLoading] = useState(true);
  const [shortcuts, setShortcuts] = useState([] as Shortcut[]);
  const [searchCode, setSearchCode] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 5;

  const loadShortcuts = async (returnToFirstPage: boolean = false) => {
    try {
      const resp = await fetch(
        API_PATH + `/shortcuts?limit=${limit}&page=${page}&code=${searchCode}`,
        {
          // method: 'GET', // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          credentials: "include", // include, *same-origin, omit
        }
      );
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login";
        return;
      }
      const body = await resp.json();
      setShortcuts(body.shortcuts);
      setTotal(body.total_count);
      if (returnToFirstPage) {
        setPage(1);
      }
    } catch (e) {
      toast.error("Failed to load shortcuts. Please try again.");
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    // load shortcuts from api
    loadShortcuts();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const deleteShortcut = async (shortcut: Shortcut) => {
    const ok = window.confirm(
      `Are you sure you want to delete the shortcut: ${shortcut.Code}?`
    );
    if (ok) {
      try {
        const resp = await fetch(API_PATH + `/shortcuts/${shortcut.ID}`, {
          method: "DELETE",
          mode: "cors", // no-cors, *cors, same-origin
          credentials: "include", // include, *same-origin, omit
        });
        if (resp.status !== 200) {
          const err = await resp.text();
          throw err;
        }
        // success
        toast.success("Shortcut deleted!");
        loadShortcuts();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete shortcut.");
      }
    }
  };

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5}>Shortcuts</Heading>
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
                    if (e.key === "Enter") loadShortcuts(true);
                  }}
                />
              </Form.Control>
              <Form.Control>
                <Button
                  onClick={() => {
                    loadShortcuts(true);
                  }}
                >
                  <FontAwesomeIcon icon={faSearch} style={{ marginRight: 5 }} />
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
        shortcuts.map((s: Shortcut) => (
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
              <Columns.Column
                narrow
                style={{ display: "flex", alignItems: "space-evenly" }}
              >
                <Link
                  to={"/edit"}
                  state={{ shortcut: s }}
                  style={{ flex: 1, marginRight: 5 }}
                >
                  <Button className={"mb-1 is-fullwidth"}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </Button>
                </Link>
                <Button
                  style={{ flex: 1, marginLeft: 5 }}
                  color={"danger"}
                  className={"mb-1 is-fullwidth"}
                  onClick={() => deleteShortcut(s)}
                >
                  <FontAwesomeIcon icon={faTrash} />
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
