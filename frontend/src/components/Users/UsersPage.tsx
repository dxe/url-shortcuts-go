import React, { useEffect, useState } from "react";
import { API_PATH, AUTH_PATH } from "../../App";
import { Box } from "react-bulma-components";
import { toast } from "react-toastify";
import { TitleBar } from "../common/TitleBar";
import { UserItem } from "./UserItem";
import axios from "axios";

export class User {
  ID: number;
  Name: string;
  Email: string;
  Active: boolean;
  Admin: boolean;
  CreatedAt?: string;
  LastLoggedIn?: string;

  constructor() {
    this.ID = 0;
    this.Name = "";
    this.Email = "";
    this.Active = true;
    this.Admin = false;
  }
}

export const UsersPage = () => {
  const [initLoading, setInitLoading] = useState(true);
  const [users, setUsers] = useState([] as User[]);

  const loadUsers = async () => {
    try {
      const resp = await axios.get(API_PATH + `/users`, {
        withCredentials: true,
      });
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login";
        return;
      }
      setUsers(resp.data.users);
    } catch (e: any) {
      if (e.response.status === 401) {
        window.location.href = AUTH_PATH + "/login";
      }
      toast.error("Failed to load users: " + e.response.data);
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
          <UserItem user={u} onDelete={loadUsers} key={u.ID} />
        ))}
    </>
  );
};
