import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_PATH } from "../../App";
import { Button, Form, Heading, Level } from "react-bulma-components";
import { User } from "./UsersPage";

export const EditUserPage = () => {
  const location = useLocation();
  const { user } = location.state;
  const [id, setID] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [lastLoggedIn, setLastLoggedIn] = useState("");
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user as User) {
      // to edit an existing shortcut
      setID(user.ID);
      setName(user.Name);
      setEmail(user.Email);
      setActive(user.Active);
      setAdmin(user.Admin);
      setLastLoggedIn(user.LastLoggedIn);
    } else {
      // to create a new user
      setID("");
      setName("");
      setEmail("");
      setActive(true);
      setAdmin(false);
      setLastLoggedIn("");
    }
  }, [user]);

  const save = async () => {
    setSaving(true);

    // validate input fields
    if (name.length === 0) {
      alert("Name must not be blank!");
      return;
    }
    if (email.length === 0) {
      alert("Email must not be blank!");
      return;
    }

    try {
      const resp = await fetch(API_PATH + `/users/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: user ? "PUT" : "POST",
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
        body: JSON.stringify({
          name: name,
          email: email,
          active: active,
          admin: admin,
        }), // TODO: add other fields (see api)
      });
      if (resp.status !== 200) {
        const err = await resp.text();
        throw err;
      }
      // success
      navigate("/users");
    } catch (e) {
      console.error(e);
      alert("Failed to save user. Maybe they already exist?");
      setSaving(false);
    }
  };

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5}>{user ? "Edit" : "New"} User</Heading>
          </Level.Item>
        </Level.Side>
      </Level>

      <Form.Field>
        <Form.Label>Name</Form.Label>
        <Form.Field kind="addons">
          <Form.Control fullwidth>
            <Form.Input
              type="text"
              autoFocus
              value={name}
              onChange={(evt) => setName(evt.target.value)}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      <Form.Field>
        <Form.Label>Email</Form.Label>
        <Form.Field kind="addons">
          <Form.Control fullwidth>
            <Form.Input
              type="email"
              value={email}
              onChange={(evt) => setEmail(evt.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      <Form.Field kind={"group"}>
        <Form.Control>
          <Form.Checkbox
            checked={active}
            onChange={(evt) => setActive(evt.target.checked)}
          />
        </Form.Control>
        <Form.Control>
          <Form.Label onClick={() => setActive(!active)}>Active</Form.Label>
        </Form.Control>
      </Form.Field>

      <Form.Field kind={"group"}>
        <Form.Control>
          <Form.Checkbox
            checked={admin}
            onChange={(evt) => setAdmin(evt.target.checked)}
          />
        </Form.Control>
        <Form.Control>
          <Form.Label onClick={() => setAdmin(!admin)}>
            Admin{" "}
            <span style={{ fontWeight: "normal" }}>
              (gives access to manage other users)
            </span>
          </Form.Label>
        </Form.Control>
      </Form.Field>

      {lastLoggedIn && (
        <>
          <strong>Last logged in:</strong> {lastLoggedIn}
        </>
      )}

      <Form.Field kind="group" className={"pt-4"}>
        <Form.Control>
          <Button color="link" onClick={save} disabled={saving}>
            Save
          </Button>
        </Form.Control>
        <Form.Control>
          <Link to={"/users"}>
            <Button color="link" colorVariant="light">
              Cancel
            </Button>
          </Link>
        </Form.Control>
      </Form.Field>
    </>
  );
};
