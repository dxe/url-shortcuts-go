import React, { useEffect, useState } from "react";
import { Columns, Heading, Box } from "react-bulma-components";
import { API_PATH, AUTH_PATH } from "../../App";
import { Shortcut } from "../Shortcuts/ShortcutsPage";
import { toast } from "react-toastify";
import { TopShortcutsTable } from "./TopShortcutsTable";
import { TitleBar } from "../common/TitleBar";
import axios from "axios";

interface TopShortcuts {
  today: Shortcut[];
  this_week: Shortcut[];
  this_month: Shortcut[];
}

export const VisitsPage = () => {
  const [topShortcuts, setTopShortcuts] = useState({} as TopShortcuts);

  const loadTopShortcuts = async () => {
    try {
      const resp = await axios.get(API_PATH + `/shortcuts/top`, {
        withCredentials: true,
      });
      setTopShortcuts(resp.data);
    } catch (e: any) {
      if (e.response.status === 401) {
        window.location.href = AUTH_PATH + "/login";
      }
      toast.error("Failed to load top shortcuts: " + e.response.data);
    }
  };

  useEffect(() => {
    // load shortcuts from api
    loadTopShortcuts();
  }, []);

  return (
    <>
      <TitleBar title={"Top Shortcuts"} />

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
