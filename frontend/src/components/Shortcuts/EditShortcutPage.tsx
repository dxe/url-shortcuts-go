import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_PATH } from "../../App";
import { Button, Form } from "react-bulma-components";
import { Shortcut } from "./ShortcutsPage";
import { toast } from "react-toastify";
import { TitleBar } from "../common/TitleBar";
import axios from "axios";

export const EditShortcutPage = () => {
  const location = useLocation();
  const [shortcut, setShortcut] = useState(new Shortcut());
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (location?.state?.shortcut as Shortcut) {
      setShortcut(location.state.shortcut);
    }
  }, [location.state]);

  const validateForm = (): boolean => {
    if (shortcut.Code.length === 0) {
      toast.error("Short link code must not be blank.");
      return false;
    }
    if (shortcut.Code.indexOf(" ") !== -1) {
      toast.error("Short link code must not contain spaces.");
      return false;
    }
    if (
      shortcut.URL.substr(0, 7) !== "http://" &&
      shortcut.URL.substr(0, 8) !== "https://"
    ) {
      toast.error("Target URL must begin with 'http://' or 'https://' prefix.");
      return false;
    }
    return true;
  };

  const save = async () => {
    setSaving(true);

    if (!validateForm()) {
      setSaving(false);
      return;
    }

    try {
      await axios(API_PATH + `/shortcuts/${shortcut.ID ? shortcut.ID : ""}`, {
        withCredentials: true,
        method: shortcut.ID ? "PUT" : "POST",
        data: shortcut,
      });
      toast.success("Shortcut saved!");
      navigate("/");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save shortcut: " + e.response.data);
      setSaving(false);
    }
  };

  return (
    <>
      <TitleBar title={(shortcut.ID ? "Edit" : "New") + " Shortcut"} />

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
              value={shortcut.Code}
              onChange={(evt) =>
                setShortcut((prev) => ({
                  ...prev,
                  Code: evt.target.value.toLowerCase().trim(),
                }))
              }
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
              value={shortcut.URL}
              onChange={(evt) =>
                setShortcut((prev) => ({ ...prev, URL: evt.target.value.trim() }))
              }
              onKeyPress={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </Form.Control>
        </Form.Field>
      </Form.Field>

      {shortcut.UpdatedAt && (
        <>
          Last Updated at {shortcut.UpdatedAt} by {shortcut.UpdatedByName}.
        </>
      )}

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
