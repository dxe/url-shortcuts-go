import { Box, Button, Columns, Heading, Icon } from "react-bulma-components";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faPencilAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import React from "react";
import { Shortcut } from "./ShortcutsPage";
import { API_PATH } from "../../App";
import axios from "axios";

interface ShortcutItemProps {
  shortcut: Shortcut;
  onDelete: () => void;
}

export const ShortcutItem = (props: ShortcutItemProps) => {
  const deleteShortcut = async () => {
    const ok = window.confirm(
      `Are you sure you want to delete the shortcut: ${props.shortcut.Code}?`
    );
    if (ok) {
      try {
        await axios.delete(API_PATH + `/shortcuts/${props.shortcut.ID}`, {
          withCredentials: true,
        });
        toast.success("Shortcut deleted!");
        props.onDelete();
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to delete shortcut: " + e.response.data);
      }
    }
  };

  return (
    <Box
      style={{ marginBottom: 10, border: 3, borderSpacing: "solid" }}
      key={props.shortcut.ID}
    >
      <Columns style={{ flexDirection: "row-reverse" }}>
        <Columns.Column>
          <Heading
            size={4}
            style={{ cursor: "pointer" }}
            onClick={() => {
              toast.promise(
                navigator.clipboard.writeText(
                  "https://dxe.io/" + props.shortcut.Code
                ),
                {
                  pending: "Copying...",
                  success: {
                    render() {
                      return "Shortcut copied to clipboard.";
                    },
                    type: "info",
                  },
                  error: "Failed to copy shortcut to clipboard.",
                }
              );
            }}
          >
            <span style={{ color: "grey" }}>dxe.io/</span>
            {props.shortcut.Code}
            <Button size={"small"} color={"white"} rounded>
              <Icon>
                <FontAwesomeIcon icon={faCopy} style={{ color: "grey" }} />
              </Icon>
            </Button>
          </Heading>
          <Heading subtitle size={6}>
            <a href={props.shortcut.URL} target={"_blank"} rel={"noreferrer"}>
              {props.shortcut.URL}
            </a>
          </Heading>
        </Columns.Column>
        <Columns.Column
          narrow
          style={{ display: "flex", alignItems: "space-evenly" }}
        >
          <Link
            to={"/edit"}
            state={{ shortcut: props.shortcut }}
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
            onClick={deleteShortcut}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Columns.Column>
      </Columns>
    </Box>
  );
};
