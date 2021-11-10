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
  // TODO: combine these three things into a "paging" object
  const [paging, setPaging] = useState({ total: 0, limit: 5, page: 1 });

  const loadShortcuts = async () => {
    try {
      const resp = await axios.get(
        API_PATH +
          `/shortcuts?limit=${paging.limit}&page=${paging.page}&code=${searchCode}`,
        { withCredentials: true }
      );
      setShortcuts(resp.data.shortcuts);
      setPaging((prev) => ({ ...prev, total: resp.data.total_count }));
    } catch (e: any) {
      if (e.response.status === 401) {
        window.location.href = AUTH_PATH + "/login";
      }
      toast.error("Failed to load shortcuts: " + e.response.data);
    } finally {
      setInitLoading(false);
    }
  };

  const search = (val: string) => {
    setPaging((prev) => ({ ...prev, page: 1 }));
    setSearchCode(val);
  };

  useEffect(() => {
    loadShortcuts();
    // TODO: look into this more to see if it's a problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paging.page, searchCode]);

  return (
    <>
      <TitleBar title="Shortcuts" onSearchSubmit={search} />

      {!initLoading && shortcuts && shortcuts.length === 0 && (
        <Box>No shortcuts found.</Box>
      )}

      {shortcuts &&
        shortcuts.map((s: Shortcut) => (
          <ShortcutItem shortcut={s} onDelete={loadShortcuts} key={s.ID} />
        ))}

      <Pagination
        current={paging.page}
        showFirstLast
        total={Math.ceil(paging.total / paging.limit)}
        onChange={(pageNum) => {
          setPaging((prev) => ({ ...prev, page: pageNum }));
        }}
        className={"pt-4"}
      />
    </>
  );
};
