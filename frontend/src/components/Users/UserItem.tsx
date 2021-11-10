import { Box, Button, Columns, Heading, Tag } from "react-bulma-components";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { User } from "./UsersPage";
import { API_PATH } from "../../App";
import { toast } from "react-toastify";
import axios from "axios";

interface UserItemProps {
  user: User;
  onDelete: () => void;
}

export const UserItem = (props: UserItemProps) => {
  const deleteUser = async () => {
    const ok = window.confirm(
      `Are you sure you want to delete the user: ${props.user.Name}?`
    );
    if (ok) {
      try {
        await axios.delete(API_PATH + `/users/${props.user.ID}`, {
          withCredentials: true,
        });
        toast.success("User deleted!");
        props.onDelete();
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to delete user: " + e.response.data);
      }
    }
  };

  return (
    <Box
      style={{ marginBottom: 10, border: 3, borderSpacing: "solid" }}
      key={props.user.ID}
    >
      <Columns style={{ flexDirection: "row-reverse" }}>
        <Columns.Column>
          {/*TODO: show a copy icon & display a toast after clicking it to say success or error */}
          <Heading size={5}>{props.user.Name}</Heading>
          <Heading subtitle size={6}>
            {props.user.Email}
          </Heading>
          <Heading>
            {/*TODO: use flexbox space b/w instead of margin*/}
            {props.user.Active && (
              <Tag color="success" className={"mr-2"}>
                Active
              </Tag>
            )}
            {props.user.Admin && <Tag color="info">Admin</Tag>}
          </Heading>
        </Columns.Column>
        <Columns.Column
          narrow
          style={{ display: "flex", alignItems: "space-evenly" }}
        >
          <Link
            to={"/edit_user"}
            state={{ user: props.user }}
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
            onClick={deleteUser}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Columns.Column>
      </Columns>
    </Box>
  );
};
