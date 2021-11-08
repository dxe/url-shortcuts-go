import {Box, Button, Columns, Heading, Tag} from "react-bulma-components";
import {Link} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPencilAlt, faTrash} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import {User} from "./UsersPage";
import {API_PATH} from "../../App";
import {toast} from "react-toastify";

interface UserItemProps {
  user: User
  onDelete: () => void;
}

export const UserItem = (props: UserItemProps) => {

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
        props.onDelete();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete user.");
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
            onClick={() => deleteUser(props.user)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Columns.Column>
      </Columns>
    </Box>

  )
}