import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_PATH } from "../../App";
import { Button, Form } from "react-bulma-components";
import { User } from "./UsersPage";
import { toast } from "react-toastify";
import { TitleBar } from "../common/TitleBar";
import axios from "axios";

export const EditUserPage = () => {
  const location = useLocation();
  const [user, setUser] = useState(new User());
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (location?.state?.user as User) {
      setUser(location.state.user);
    }
  }, [location.state]);

  const validateFields = (): boolean => {
    if (user.Name.length === 0) {
      toast.error("Name must not be blank!");
      return false;
    }
    if (user.Email.length === 0) {
      toast.error("Email must not be blank!");
      return false;
    }
    return true;
  };

  const save = async () => {
    setSaving(true);
    if (!validateFields()) {
      setSaving(false);
      return;
    }

    try {
      await axios(API_PATH + `/users/${user.ID || ""}`, {
        withCredentials: true,
        method: user.ID ? "PUT" : "POST",
        data: user,
      });
      toast.success("User saved!");
      navigate("/users");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save user: " + e.response.data);
      setSaving(false);
    }
  };

  return (
    <>
      <TitleBar title={(user.ID ? "Edit" : "New") + " User"} />

      <Form.Field>
        <Form.Label>Name</Form.Label>
        <Form.Field kind="addons">
          <Form.Control fullwidth>
            <Form.Input
              type="text"
              autoFocus
              value={user.Name}
              onChange={(evt) =>
                setUser((prev) => ({ ...prev, Name: evt.target.value }))
              }
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
              value={user.Email}
              onChange={(evt) =>
                setUser((prev) => ({ ...prev, Email: evt.target.value }))
              }
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
            checked={user.Active}
            onChange={(evt) =>
              setUser((prev) => ({ ...prev, Active: evt.target.checked }))
            }
          />
        </Form.Control>
        <Form.Control>
          <Form.Label
            onClick={() =>
              setUser((prev) => ({ ...prev, Active: !prev.Active }))
            }
          >
            Active
          </Form.Label>
        </Form.Control>
      </Form.Field>

      <Form.Field kind={"group"}>
        <Form.Control>
          <Form.Checkbox
            checked={user.Admin}
            onChange={(evt) =>
              setUser((prev) => ({ ...prev, Admin: evt.target.checked }))
            }
          />
        </Form.Control>
        <Form.Control>
          <Form.Label
            onClick={() => setUser((prev) => ({ ...prev, Admin: !prev.Admin }))}
          >
            Admin{" "}
            <span style={{ fontWeight: "normal" }}>
              (gives access to manage other users)
            </span>
          </Form.Label>
        </Form.Control>
      </Form.Field>

      {user.LastLoggedIn && (
        <>
          <strong>Last logged in:</strong> {user.LastLoggedIn}
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
