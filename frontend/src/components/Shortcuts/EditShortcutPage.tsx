import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_PATH } from "../../App";
import { Button, Form, Heading, Level } from "react-bulma-components";
import { Shortcut } from "./ShortcutsPage";

export const EditShortcutPage = () => {
  const location = useLocation();
  const { shortcut } = location.state;
  const [id, setID] = useState("");
  const [code, setCode] = useState("");
  const [target, setTarget] = useState("");
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shortcut as Shortcut) {
      // to edit an existing shortcut
      setID(shortcut.ID);
      setCode(shortcut.Code);
      setTarget(shortcut.URL);
    } else {
      // to create a new shortcut
      setID("");
      setCode("");
      setTarget("");
    }
  }, [shortcut]);

  const save = async () => {
    setSaving(true);

    // validate input fields
    if (code.length === 0) {
      alert("Short Link must not be blank!");
      return;
    }
    if (code.indexOf(" ") !== -1) {
      alert("Short Link must not contain spaces!");
      return;
    }
    if (
      target.substr(0, 7) !== "http://" &&
      target.substr(0, 8) !== "https://"
    ) {
      alert(`Target URL must begin with "http://" or "https://" prefix.`);
      return;
    }

    try {
      const resp = await fetch(API_PATH + `/shortcuts/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: shortcut ? "PUT" : "POST",
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
        body: JSON.stringify({ code: code, url: target }),
      });
      if (resp.status !== 200) {
        const err = await resp.text();
        throw err;
      }
      // success
      navigate("/");
    } catch (e) {
      console.error(e);
      alert("Failed to save shortcut. Maybe it already exists?");
      setSaving(false);
    }
  };

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5}>{shortcut ? "Edit" : "New"} Shortcut</Heading>
          </Level.Item>
        </Level.Side>
      </Level>

      <Form.Field>
        <Form.Label>Short Link</Form.Label>
        <Form.Field kind="addons">
          <Form.Control>
            <Button disabled className={"is-large"}>
              dxe.io/
            </Button>
          </Form.Control>
          <Form.Control fullwidth>
            <Form.Input
              placeholder=""
              type="text"
              className={"is-large"}
              autoFocus
              value={code}
              onChange={(evt) => setCode(evt.target.value.toLowerCase())}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      <Form.Field>
        <Form.Label>Target URL</Form.Label>
        <Form.Field kind="addons">
          <Form.Control fullwidth>
            <Form.Input
              placeholder="https://"
              type="text"
              value={target}
              onChange={(evt) => setTarget(evt.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      <Form.Field kind="group" className={"pt-4"}>
        <Form.Control>
          <Button color="link" onClick={save} disabled={saving}>
            Save
          </Button>
        </Form.Control>
        <Form.Control>
          <Link to={"/"}>
            <Button color="link" colorVariant="light">
              Cancel
            </Button>
          </Link>
        </Form.Control>
      </Form.Field>
    </>
  );
};
