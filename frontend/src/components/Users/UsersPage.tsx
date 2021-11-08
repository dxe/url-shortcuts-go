import React, { useEffect, useState } from "react";
import { API_PATH, AUTH_PATH } from "../../App";
import {
  Box,
  Button,
  Columns,
  Tag,
  Heading,
  Level,
} from "react-bulma-components";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

export interface User {
  ID: number;
  Name: string;
  Email: string;
  Active: boolean;
  Admin: boolean;
  CreatedAt: string;
  LastLoggedIn: string;
}

export const UsersPage = () => {
  const [initLoading, setInitLoading] = useState(true);
  const [users, setUsers] = useState([] as User[]);

  const loadUsers = async () => {
    try {
      const resp = await fetch(API_PATH + `/users`, {
        // method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
      });
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login";
        return;
      }
      const body = await resp.json();
      setUsers(body.users);
    } catch (e) {
      toast.error("Failed to load users. Please try again.");
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    // load shortcuts from api
    loadUsers();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteUser = async (u: User) => {
    const ok = window.confirm(
      `Are you sure you want to delete the user: ${u.Name}?`
    );
    if (ok) {
      try {
        const resp = await fetch(API_PATH + `/users/${u.ID}`, {
          method: "DELETE",
          mode: "cors", // no-cors, *cors, same-origin
          credentials: "include", // include, *same-origin, omit
        });
        if (resp.status !== 200) {
          const err = await resp.text();
          throw err;
        }
        // success
        toast.success("User deleted!");
        loadUsers();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete user.");
      }
    }
  };

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5}>Users</Heading>
          </Level.Item>
        </Level.Side>
      </Level>

      {!initLoading && users && users.length === 0 && (
        <Box>No users found.</Box>
      )}

      {users &&
        // TODO: use type
        users.map((u: User) => (
          <Box
            style={{ marginBottom: 10, border: 3, borderSpacing: "solid" }}
            key={u.ID}
          >
            <Columns style={{ flexDirection: "row-reverse" }}>
              <Columns.Column>
                {/*TODO: show a copy icon & display a toast after clicking it to say success or error */}
                <Heading size={5}>{u.Name}</Heading>
                <Heading subtitle size={6}>
                  {u.Email}
                </Heading>
                <Heading>
                  {/*TODO: use flexbox space b/w instead of margin*/}
                  {u.Active && (
                    <Tag color="success" className={"mr-2"}>
                      Active
                    </Tag>
                  )}
                  {u.Admin && <Tag color="info">Admin</Tag>}
                </Heading>
              </Columns.Column>
              <Columns.Column
                narrow
                style={{ display: "flex", alignItems: "space-evenly" }}
              >
                <Link
                  to={"/edit_user"}
                  state={{ user: u }}
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
                  onClick={() => deleteUser(u)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </Columns.Column>
            </Columns>
          </Box>
        ))}
    </>
  );
};
