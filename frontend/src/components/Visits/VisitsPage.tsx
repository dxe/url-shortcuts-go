import React, { useEffect, useState } from "react";
import { Columns, Heading, Level, Table, Box } from "react-bulma-components";
import { API_PATH, AUTH_PATH } from "../../App";
import { Shortcut } from "../Shortcuts/ShortcutsPage";
import { toast } from "react-toastify";
import { TopShortcutsTable } from "./TopShortcutsTable";

interface TopShortcuts {
  today: Shortcut[];
  this_week: Shortcut[];
  this_month: Shortcut[];
}

export const VisitsPage = () => {
  const [topShortcuts, setTopShortcuts] = useState({} as TopShortcuts);

  const loadTopShortcuts = async () => {
    try {
      const resp = await fetch(API_PATH + `/shortcuts/top`, {
        // method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
      });
      if (resp.status === 401) {
        window.location.href = AUTH_PATH + "/login";
        return;
      }
      const body = await resp.json();
      setTopShortcuts(body);
    } catch (e) {
      toast.error("Failed to load top shortcuts. Please try again.");
    }
  };

  useEffect(() => {
    // load shortcuts from api
    loadTopShortcuts();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Level>
        <Level.Side>
          <Level.Item>
            <Heading size={5}>Top Shortcuts</Heading>
          </Level.Item>
        </Level.Side>
      </Level>

      <Columns>
        <Columns.Column>
          <Box>
            <Heading size={3}>Today</Heading>
            <TopShortcutsTable shortcuts={topShortcuts.today} />
          </Box>
        </Columns.Column>
        <Columns.Column>
          <Box>
            <Heading size={3}>This Week</Heading>
            <TopShortcutsTable shortcuts={topShortcuts.this_week} />
          </Box>
        </Columns.Column>
        <Columns.Column>
          <Box>
            <Heading size={3}>This Month</Heading>
            <TopShortcutsTable shortcuts={topShortcuts.this_month} />
          </Box>
        </Columns.Column>
      </Columns>
    </>
  );
};
