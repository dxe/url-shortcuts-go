import React, { useEffect, useState } from "react";
import { Box, Pagination } from "react-bulma-components";
import { API_PATH, AUTH_PATH } from "../../App";
import { toast } from "react-toastify";
import { ShortcutItem } from "./ShortcutItem";
import { TitleBar } from "../common/TitleBar";
import axios from "axios";

export class Shortcut {
  ID: number;
  Code: string;
  URL: string;
  CreatedAt?: string;
  CreatedBy?: number;
  UpdatedAt?: string;
  UpdatedBy?: number;
  UpdatedByName?: string;
  TotalVisits?: number; // only used for reporting, not always populated

  constructor() {
    this.ID = 0;
    this.Code = "";
    this.URL = "";
  }
}

export const ShortcutsPage = () => {
  const [initLoading, setInitLoading] = useState(true);
  const [shortcuts, setShortcuts] = useState([] as Shortcut[]);
  const [searchCode, setSearchCode] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 5;

  const loadShortcuts = async () => {
    try {
      const resp = await axios.get(
        API_PATH + `/shortcuts?limit=${limit}&page=${page}&code=${searchCode}`,
        { withCredentials: true }
      );
      setShortcuts(resp.data.shortcuts);
      setTotal(resp.data.total_count);
    } catch (e: any) {
      if (e.response.status === 401) {
        window.location.href = AUTH_PATH + "/login";
      }
      toast.error("Failed to load shortcuts: " + e.response.data);
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    loadShortcuts();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // Changing the page # will automatically trigger a reload w/ the new search value.
    page === 1 ? loadShortcuts() : setPage(1);
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCode]);

  return (
    <>
      <TitleBar title="Shortcuts" onSearchSubmit={setSearchCode} />

      {!initLoading && shortcuts && shortcuts.length === 0 && (
        <Box>No shortcuts found.</Box>
      )}

      {shortcuts &&
        shortcuts.map((s: Shortcut) => (
          <ShortcutItem shortcut={s} onDelete={loadShortcuts} key={s.ID} />
        ))}

      <Pagination
        current={page}
        showFirstLast
        total={Math.ceil(total / limit)}
        onChange={(pageNum) => {
          setPage(pageNum);
        }}
        className={"pt-4"}
      />
    </>
  );
};
