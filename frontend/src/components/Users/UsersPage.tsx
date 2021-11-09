import React, { useEffect, useState } from "react";
import { API_PATH, AUTH_PATH } from "../../App";
import {
  Box,
} from "react-bulma-components";
import { toast } from "react-toastify";
import {TitleBar} from "../common/TitleBar";
import {UserItem} from "./UserItem";

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
  }, []);

  return (
    <>
      <TitleBar title={"Users"} />

      {!initLoading && users && users.length === 0 && (
        <Box>No users found.</Box>
      )}

      {users &&
        users.map((u: User) => (
          <UserItem user={u} onDelete={loadUsers} />
        ))}
    </>
  );
};
